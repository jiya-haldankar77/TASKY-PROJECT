// ============================================================
// Scheduling Engine — Rule-based resource scheduling
// ============================================================

/**
 * Calculate workload for a resource across all active tasks.
 * Returns remaining effort hours for the current week.
 */
export async function calculateResourceWorkload(pool, userId) {
  const [rows] = await pool.execute(
    `
    SELECT
      u.id AS user_id,
      u.max_hours_per_week,
      COUNT(DISTINCT t.id) AS active_task_count,
      COALESCE(SUM(
        CASE WHEN ta2.active_assignee_count > 0
          THEN ((t.expected_effort * (100 - t.progress) / 100) / ta2.active_assignee_count) / GREATEST(1, DATEDIFF(t.deadline, CURDATE()) / 7.0)
          ELSE 0
        END
      ), 0) AS weekly_required_hours,
      COALESCE(SUM(t.actual_effort), 0) AS total_hours_logged,
      COUNT(DISTINCT t.project_id) AS project_count
    FROM user u
    LEFT JOIN task_assignment ta ON ta.user_id = u.id AND ta.is_active = 1
    LEFT JOIN task t ON t.id = ta.task_id AND t.status IN ('not-started', 'in-progress', 'blocked')
    LEFT JOIN (
      SELECT task_id, COUNT(*) AS active_assignee_count
      FROM task_assignment WHERE is_active = 1 GROUP BY task_id
    ) ta2 ON ta2.task_id = t.id
    WHERE u.id = ?
    GROUP BY u.id, u.max_hours_per_week
  `,
    [userId],
  );

  if (rows.length === 0) return null;

  const workload = rows[0];
  const utilization =
    workload.max_hours_per_week > 0
      ? (workload.weekly_required_hours / workload.max_hours_per_week) * 100
      : 0;

  return {
    ...workload,
    utilization: Math.round(utilization * 100) / 100,
    status: utilization > 100 ? 'overloaded' : utilization > 80 ? 'near-capacity' : 'available',
  };
}

/**
 * Get all resources with their workload data for an organization.
 */
export async function getOrgResourceWorkloads(pool, orgId) {
  const [rows] = await pool.execute(
    `
    SELECT
      u.id AS user_id,
      u.first_name,
      u.last_name,
      u.employee_code,
      u.email,
      u.avatar,
      u.phone,
      u.skills,
      u.max_hours_per_week,
      u.professional_role,
      r.name AS role_name,
      r.access_level,
      COUNT(DISTINCT t.id) AS active_task_count,
      COALESCE(SUM(
        CASE WHEN t.id IS NOT NULL AND ta2.active_assignee_count > 0
          THEN ((t.expected_effort * (100 - t.progress) / 100) / ta2.active_assignee_count) / GREATEST(1, DATEDIFF(t.deadline, CURDATE()) / 7.0)
          ELSE 0
        END
      ), 0) AS weekly_required_hours,
      COALESCE(SUM(t.actual_effort), 0) AS total_hours_logged,
      COUNT(DISTINCT t.project_id) AS project_count
    FROM user u
    JOIN role r ON r.id = u.role_id
    LEFT JOIN task_assignment ta ON ta.user_id = u.id AND ta.is_active = 1
    LEFT JOIN task t ON t.id = ta.task_id AND t.status IN ('not-started', 'in-progress', 'blocked')
    LEFT JOIN (
      SELECT task_id, COUNT(*) AS active_assignee_count
      FROM task_assignment WHERE is_active = 1 GROUP BY task_id
    ) ta2 ON ta2.task_id = t.id
    WHERE u.org_id = ? AND u.is_active = 1 AND r.access_level = 'employee'
    GROUP BY u.id, u.first_name, u.last_name, u.employee_code, u.email, u.avatar,
             u.phone, u.skills, u.max_hours_per_week, u.professional_role, r.name, r.access_level
  `,
    [orgId],
  );

  return rows.map((r) => {
    const utilization =
      r.max_hours_per_week > 0 ? (r.weekly_required_hours / r.max_hours_per_week) * 100 : 0;
    return {
      ...r,
      utilization: Math.round(utilization * 100) / 100,
      workload_status:
        utilization > 100 ? 'overloaded' : utilization > 80 ? 'near-capacity' : 'available',
    };
  });
}

/**
 * Auto-assign: Score and rank resources for a task.
 * Scoring factors:
 *   - Available capacity (lower workload = higher score)
 *   - Skill match (matching skills = bonus)
 *   - Project involvement (already on project = bonus for context)
 *   - Task load (fewer active tasks = higher score)
 */
export async function recommendResources(pool, orgId, taskId) {
  // Get task details
  const [taskRows] = await pool.execute('SELECT * FROM task WHERE id = ?', [taskId]);
  if (taskRows.length === 0) return [];
  const task = taskRows[0];

  // Get all available employees in the org
  const resources = await getOrgResourceWorkloads(pool, orgId);

  // Get who is already assigned to this task
  const [existingAssignments] = await pool.execute(
    'SELECT user_id FROM task_assignment WHERE task_id = ? AND is_active = 1',
    [taskId],
  );
  const assignedIds = new Set(existingAssignments.map((a) => a.user_id));

  // Score each resource
  const scored = resources
    .filter((r) => !assignedIds.has(r.user_id))
    .map((r) => {
      let score = 0;

      // Capacity score (0-40 points): lower utilization = higher score
      const capacityScore = Math.max(0, 40 - r.utilization * 0.4);
      score += capacityScore;

      // Skill match score (0-30 points)
      let skills = [];
      try {
        skills = typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills || [];
      } catch (e) {
        skills = [];
      }
      const taskTitle = (task.title + ' ' + (task.description || '')).toLowerCase();
      const matchingSkills = skills.filter((s) => taskTitle.includes(s.toLowerCase()));
      score += Math.min(30, matchingSkills.length * 10);

      // Project involvement score (0-15 points)
      // Check if resource is already on this project's other tasks
      score += r.project_count > 0 ? 15 : 0;

      // Task load score (0-15 points): fewer tasks = higher score
      const taskLoadScore = Math.max(0, 15 - r.active_task_count * 2.5);
      score += taskLoadScore;

      return {
        user_id: r.user_id,
        name: `${r.first_name} ${r.last_name}`,
        employee_code: r.employee_code,
        role_name: r.role_name,
        avatar: r.avatar,
        skills,
        utilization: r.utilization,
        active_task_count: r.active_task_count,
        workload_status: r.workload_status,
        score: Math.round(score * 100) / 100,
        reasons: [
          `Capacity: ${Math.round(100 - r.utilization)}% available`,
          matchingSkills.length > 0
            ? `Skills: ${matchingSkills.join(', ')}`
            : 'No direct skill match',
          `Current tasks: ${r.active_task_count}`,
        ],
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Analyze impact of a task delay on dependent tasks.
 * Traverses the dependency DAG forward from the given task.
 */
export async function analyzeImpact(pool, taskId, delayDays = 0) {
  // Get the task
  const [taskRows] = await pool.execute('SELECT * FROM task WHERE id = ?', [taskId]);
  if (taskRows.length === 0) return { affected: [] };
  const task = taskRows[0];

  // Get all downstream dependencies (BFS)
  const affected = [];
  const visited = new Set();
  const queue = [{ taskId: task.id, delay: delayDays }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current.taskId)) continue;
    visited.add(current.taskId);

    // Find tasks that depend on this one
    const [deps] = await pool.execute(
      `SELECT t.*, td.dependency_type
       FROM task_dependency td
       JOIN task t ON t.id = td.task_id
       WHERE td.depends_on_id = ? AND t.status != 'completed'`,
      [current.taskId],
    );

    for (const dep of deps) {
      const newDeadline = new Date(dep.deadline);
      newDeadline.setDate(newDeadline.getDate() + current.delay);

      affected.push({
        task_id: dep.id,
        title: dep.title,
        project_id: dep.project_id,
        current_deadline: dep.deadline,
        suggested_deadline: newDeadline.toISOString().split('T')[0],
        delay_days: current.delay,
        dependency_type: dep.dependency_type,
        status: dep.status,
      });

      queue.push({ taskId: dep.id, delay: current.delay });
    }
  }

  return { source_task: task, affected };
}

/**
 * Detect overloaded resources in an organization.
 */
export async function detectOverloadedResources(pool, orgId, threshold = 40) {
  const resources = await getOrgResourceWorkloads(pool, orgId);
  return resources.filter((r) => r.weekly_required_hours > threshold);
}

/**
 * Global Auto-Scheduler: Dynamically assigns unassigned tasks to available resources.
 * Triggered when a resource finishes a task early or task priorities change, freeing up capacity.
 */
export async function runGlobalAutoScheduler(pool, orgId) {
  // Fetch all unassigned active tasks for the org
  // A task is considered needing assignment if active_assignees < resources_needed
  const [unassignedTasks] = await pool.execute(
    `
    SELECT t.*, 
           (SELECT COUNT(*) FROM task_assignment ta WHERE ta.task_id = t.id AND ta.is_active = 1) AS active_assignees
    FROM task t
    JOIN project p ON p.id = t.project_id
    WHERE p.org_id = ? AND t.status IN ('not-started', 'in-progress')
    HAVING active_assignees < t.resources_needed
    ORDER BY FIELD(t.priority, 'critical', 'high', 'medium', 'low'), t.deadline ASC
  `,
    [orgId],
  );

  let assignedCount = 0;

  for (const task of unassignedTasks) {
    let needed = task.resources_needed - task.active_assignees;

    // Score all resources for this task (using fresh current state of workloads)
    const recommendations = await recommendResources(pool, orgId, task.id);

    // We only assign if we find a resource with capacity to take this entire task without exceeding 100%
    if (recommendations.length > 0) {
      for (const best of recommendations) {
        if (needed <= 0) break;

        // Assume the task will be divided by (current assignees + 1) to test potential utilization
        const newAssigneeCount = task.active_assignees + 1;
        const taskRemainingHours =
          (task.expected_effort * (100 - task.progress)) / 100 / newAssigneeCount;
        const weeksRemaining = Math.max(
          1,
          (new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7),
        );
        const weeklyRequiredForTask = taskRemainingHours / weeksRemaining;

        const maxHours = best.max_hours_per_week || 40;
        const potentialNewUtilization =
          ((best.weekly_required_hours + weeklyRequiredForTask) / maxHours) * 100;

        if (potentialNewUtilization <= 100) {
          await pool.execute(
            'INSERT INTO task_assignment (task_id, user_id, assigned_by) VALUES (?, ?, ?)',
            [task.id, best.user_id, task.created_by],
          );
          assignedCount++;
          needed--;
          task.active_assignees++;
        }
      }
    }
  }

  return { success: true, assignedCount };
}

/**
 * Rebalance Workloads:
 * 1. Find overloaded resources (> 100% capacity)
 * 2. Unassign their lowest priority or not-started tasks until they are under 100%
 * 3. Trigger runGlobalAutoScheduler to reassign these tasks to free resources
 */
export async function rebalanceWorkloads(pool, orgId) {
  let tasksUnassigned = 0;

  // 1. Get overloaded resources (utilization > 100%)
  const resources = await getOrgResourceWorkloads(pool, orgId);
  const overloaded = resources.filter((r) => r.utilization > 100);

  for (const resource of overloaded) {
    // Current hours for this resource
    let currentHours = resource.weekly_required_hours;
    const maxHours = resource.max_hours_per_week || 40;

    // Get their active tasks, sorted by priority (low first) and progress (low first)
    const [tasks] = await pool.execute(
      `
      SELECT t.id, t.expected_effort, t.progress, ta.id as assignment_id,
             (SELECT COUNT(*) FROM task_assignment WHERE task_id = t.id AND is_active = 1) as active_assignee_count
      FROM task t
      JOIN task_assignment ta ON ta.task_id = t.id AND ta.user_id = ? AND ta.is_active = 1
      WHERE t.status IN ('not-started', 'in-progress', 'blocked')
      ORDER BY FIELD(t.priority, 'low', 'medium', 'high', 'critical'), t.progress ASC
    `,
      [resource.user_id],
    );

    // Unassign tasks until under capacity
    for (const task of tasks) {
      if (currentHours <= maxHours) break;

      const assignees = task.active_assignee_count || 1;
      const taskRemainingHours = (task.expected_effort * (100 - task.progress)) / 100 / assignees;
      const weeksRemaining = Math.max(
        1,
        (new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7),
      );
      const weeklyRequiredForTask = taskRemainingHours / weeksRemaining;

      // Prevent ER_DUP_ENTRY by deleting any existing inactive assignment for this task and user
      await pool.execute(
        'DELETE FROM task_assignment WHERE task_id = ? AND user_id = ? AND is_active = 0',
        [task.id, resource.user_id],
      );

      // Unassign this task
      await pool.execute(
        'UPDATE task_assignment SET is_active = 0, unassigned_at = NOW() WHERE id = ?',
        [task.assignment_id],
      );

      currentHours -= weeklyRequiredForTask;
      tasksUnassigned++;
    }
  }

  // 3. Re-allocate unassigned tasks globally
  let assignedCount = 0;
  if (tasksUnassigned > 0) {
    const result = await runGlobalAutoScheduler(pool, orgId);
    assignedCount = result.assignedCount;
  }

  return { success: true, tasksUnassigned, assignedCount };
}
// --- NEW SCHEDULING ENGINE FUNCTIONS ---

/**
 * Computes urgency score based on priority, deadline, and interrupt status.
 */
export function computeUrgencyScore(task) {
  const weights = { critical: 40, high: 30, medium: 20, low: 10 };
  const deadlineDate = new Date(task.deadline || new Date());
  const now = new Date();
  const timeDiff = deadlineDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  const interruptPenalty = ['blocked','on-hold'].includes(task.status) ? 0.5 : 0;
  const priorityWeight = weights[task.priority] || 20;
  
  return (priorityWeight / daysLeft) * (1 + interruptPenalty);
}

/**
 * Builds a reschedule proposal and queues it for review or auto-applies.
 */
export async function buildRescheduleProposal(pool, orgId, triggerType, triggerRefId, affectedUserIds) {
  if (!affectedUserIds || affectedUserIds.length === 0) return null;
  
  // 1. Fetch active tasks for users
  const [tasks] = await pool.execute(
    `SELECT t.*, ta.user_id 
     FROM task t
     JOIN task_assignment ta ON t.id = ta.task_id
     JOIN project p ON t.project_id = p.id
     WHERE p.org_id = ? 
       AND ta.user_id IN (${affectedUserIds.join(',')})
       AND t.status NOT IN ('completed')
       AND ta.is_active = 1`,
    [orgId]
  );
  
  if (tasks.length === 0) return null;

  // 2. Compute urgency scores
  tasks.forEach(t => {
    t.computed_urgency = computeUrgencyScore(t);
  });
  
  // 3. Sort by urgency (descending)
  tasks.sort((a, b) => b.computed_urgency - a.computed_urgency);
  
  // 4 & 5. Slot into calendar and walk dependency DAG
  const changes = [];
  const changesMap = new Map(); // Keep track of latest end date per task
  const today = new Date();
  let currentStart = new Date(today);
  
  for (const t of tasks) {
    if (changesMap.has(t.id)) continue; // Already processed as a dependency

    const durationDays = Math.ceil((t.expected_effort || 8) / 8);
    const newStart = new Date(currentStart);
    
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + durationDays);
    
    changes.push({
      task_id: t.id,
      old_start: t.scheduled_start,
      new_start: newStart.toISOString().split('T')[0],
      old_end: t.scheduled_end,
      new_end: newEnd.toISOString().split('T')[0],
      urgency_score: t.computed_urgency,
      reason: `Reschedule triggered by ${triggerType}`
    });
    changesMap.set(t.id, newEnd);
    
    // Increment base calendar slot for next root task
    currentStart = new Date(newEnd);
    currentStart.setDate(currentStart.getDate() + 1); // simple stagger
    
    // BFS dependency walk
    const visited = new Set();
    const queue = [{ taskId: t.id, end: newEnd }];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.taskId)) continue;
      visited.add(current.taskId);
      
      const [deps] = await pool.execute(
        `SELECT t.* FROM task_dependency td
         JOIN task t ON t.id = td.task_id
         WHERE td.depends_on_id = ? AND t.status != 'completed'`,
        [current.taskId]
      );
      
      for (const dep of deps) {
        const depDuration = Math.ceil((dep.expected_effort || 8) / 8);
        const depStart = new Date(current.end);
        depStart.setDate(depStart.getDate() + 1); // Start day after predecessor ends
        
        const depEnd = new Date(depStart);
        depEnd.setDate(depStart.getDate() + depDuration);
        
        // Push only if it forces the dependency later than currently planned
        if (!changesMap.has(dep.id) || changesMap.get(dep.id) < depEnd) {
          const existingIdx = changes.findIndex(c => c.task_id === dep.id);
          const depChange = {
            task_id: dep.id,
            old_start: dep.scheduled_start,
            new_start: depStart.toISOString().split('T')[0],
            old_end: dep.scheduled_end,
            new_end: depEnd.toISOString().split('T')[0],
            urgency_score: dep.computed_urgency || computeUrgencyScore(dep),
            reason: 'Cascaded due to predecessor delay'
          };
          
          if (existingIdx >= 0) {
            changes[existingIdx] = depChange;
          } else {
            changes.push(depChange);
          }
          
          changesMap.set(dep.id, depEnd);
          queue.push({ taskId: dep.id, end: depEnd });
        }
      }
    }
  }
  
  // 6. Save proposal
  const payloadStr = JSON.stringify(changes);
  const [result] = await pool.execute(
    `INSERT INTO reschedule_event 
      (org_id, trigger_type, trigger_ref_id, affected_task_count, status, payload)
      VALUES (?, ?, ?, ?, 'pending_review', ?)`,
    [orgId, triggerType, triggerRefId, changes.length, payloadStr]
  );
  
  // Emit notification to PM
  const [pmRows] = await pool.execute(
    "SELECT u.id FROM user u JOIN role r ON u.role_id = r.id WHERE u.org_id = ? AND r.access_level = 'pm'",
    [orgId]
  );
  for (const pm of pmRows) {
    await pool.execute(
      "INSERT INTO notification (user_id, title, message, type, related_entity_type, related_entity_id, is_read) VALUES (?, ?, ?, 'task_rescheduled', 'reschedule_event', ?, 0)",
      [pm.id, 'Review Reschedule', `A ${triggerType} event caused a schedule change proposal affecting ${changes.length} tasks.`, result.insertId]
    );
  }

  return {
    reschedule_event_id: result.insertId,
    changes,
    affected_task_count: changes.length
  };
}

/**
 * Applies a confirmed reschedule proposal to the database.
 */
export async function applyRescheduleProposal(pool, eventId, appliedBy = null) {
  const [events] = await pool.execute('SELECT * FROM reschedule_event WHERE id = ?', [eventId]);
  if (events.length === 0) throw new Error('Event not found');
  
  const event = events[0];
  if (event.status !== 'pending_review' && event.status !== 'auto_applied') {
    return { success: false, message: 'Already processed' };
  }
  
  const changes = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
  
  for (const c of changes) {
    await pool.execute(
      `UPDATE task 
       SET scheduled_start = ?, scheduled_end = ?, urgency_score = ?
       WHERE id = ?`,
      [c.new_start, c.new_end, c.urgency_score, c.task_id]
    );
    
    await pool.execute(
      `INSERT INTO task_schedule_history
       (task_id, reschedule_event_id, old_scheduled_start, new_scheduled_start, old_scheduled_end, new_scheduled_end, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.task_id, eventId, c.old_start || null, c.new_start, c.old_end || null, c.new_end, c.reason]
    );
  }
  
  await pool.execute(
    `UPDATE reschedule_event SET status = 'pm_confirmed', applied_by = ?, reviewed_at = NOW() WHERE id = ?`,
    [appliedBy, eventId]
  );
  
  // Emit notification to affected employees
  const employeeIds = new Set();
  for (const c of changes) {
    const [assignees] = await pool.execute('SELECT user_id FROM task_assignment WHERE task_id = ? AND is_active = 1', [c.task_id]);
    assignees.forEach(a => employeeIds.add(a.user_id));
  }
  for (const empId of employeeIds) {
    await pool.execute(
      "INSERT INTO notification (user_id, title, message, type, related_entity_type, related_entity_id, is_read) VALUES (?, ?, ?, 'task_rescheduled', 'reschedule_event', ?, 0)",
      [empId, 'Schedule Updated', 'Your task schedule has been updated.', eventId]
    );
  }

  return { success: true, changesApplied: changes.length };
}

/**
 * Triggered when a task is interrupted (status changed to blocked or on-hold).
 */
export async function handleTaskInterrupt(pool, taskId, reason) {
  // Update interrupt count
  await pool.execute('UPDATE task SET interrupt_count = interrupt_count + 1 WHERE id = ?', [taskId]);
  
  // Get assignees and org
  const [taskRows] = await pool.execute(
    `SELECT t.id, p.org_id, ta.user_id
     FROM task t
     JOIN project p ON t.project_id = p.id
     JOIN task_assignment ta ON t.id = ta.task_id
     WHERE t.id = ? AND ta.is_active = 1`,
    [taskId]
  );
  
  if (taskRows.length === 0) return null;
  const orgId = taskRows[0].org_id;
  const userIds = taskRows.map(r => r.user_id);
  
  const proposal = await buildRescheduleProposal(pool, orgId, 'interrupt', taskId, userIds);
  
  if (proposal && proposal.affected_task_count <= 3) {
    // Auto-apply if threshold met
    await applyRescheduleProposal(pool, proposal.reschedule_event_id);
    await pool.execute("UPDATE reschedule_event SET status = 'auto_applied' WHERE id = ?", [proposal.reschedule_event_id]);
  }
  return proposal;
}

/**
 * Triggered when leave is approved.
 */
export async function handleLeaveApproval(pool, leaveRequestId) {
  const [leaveRows] = await pool.execute('SELECT * FROM leave_request WHERE id = ?', [leaveRequestId]);
  if (leaveRows.length === 0) return null;
  const leave = leaveRows[0];
  
  // Update employee availability (simplified)
  await pool.execute(
    `UPDATE employee_availability 
     SET is_available = 0, day_type = 'leave'
     WHERE user_id = ? AND date >= ? AND date <= ?`,
    [leave.user_id, leave.start_date, leave.end_date]
  );
  
  // Get org id from user
  const [userRows] = await pool.execute('SELECT org_id FROM user WHERE id = ?', [leave.user_id]);
  if (userRows.length === 0) return null;
  
  const proposal = await buildRescheduleProposal(pool, userRows[0].org_id, 'leave', leaveRequestId, [leave.user_id]);
  
  if (proposal) {
    // Leave causing deadline breach always needs PM approval, checking if auto-apply is safe.
    // For simplicity in this demo, always send to PM review if >0 tasks affected.
    // (As per Q2: Always require PM approval)
  }
  return proposal;
}

/**
 * Triggered when a task is completed before scheduled end.
 */
export async function handleEarlyCompletion(pool, taskId) {
  const [taskRows] = await pool.execute(
    `SELECT t.id, p.org_id, ta.user_id
     FROM task t
     JOIN project p ON t.project_id = p.id
     JOIN task_assignment ta ON t.id = ta.task_id
     WHERE t.id = ? AND ta.is_active = 1`,
    [taskId]
  );
  if (taskRows.length === 0) return null;
  
  const orgId = taskRows[0].org_id;
  const userIds = taskRows.map(r => r.user_id);
  
  const proposal = await buildRescheduleProposal(pool, orgId, 'early_done', taskId, userIds);
  if (proposal) {
    // Auto apply early completion
    await applyRescheduleProposal(pool, proposal.reschedule_event_id);
    await pool.execute("UPDATE reschedule_event SET status = 'auto_applied' WHERE id = ?", [proposal.reschedule_event_id]);
  }
  return proposal;
}

/**
 * Triggered by cron job daily to detect delayed tasks.
 */
export async function handleDelayDetection(pool, orgId) {
  // Simplified logic: finds tasks that haven't been updated in 5 days
  const [delayedTasks] = await pool.execute(
    `SELECT id FROM task 
     WHERE status IN ('not-started', 'in-progress') 
       AND project_id IN (SELECT id FROM project WHERE org_id = ?)
       AND updated_at < DATE_SUB(NOW(), INTERVAL 5 DAY)`,
    [orgId]
  );
  
  if (delayedTasks.length === 0) return null;
  
  for (const t of delayedTasks) {
    const [assignees] = await pool.execute('SELECT user_id FROM task_assignment WHERE task_id = ? AND is_active = 1', [t.id]);
    const userIds = assignees.map(a => a.user_id);
    if (userIds.length > 0) {
      await buildRescheduleProposal(pool, orgId, 'delay', t.id, userIds);
    }
  }
}


/**
 * Checks if a task is blocked by any incomplete dependencies.
 */
export async function checkTaskDependencies(pool, taskId) {
  const [deps] = await pool.execute(
    `SELECT t.status, t.title
     FROM task_dependency td
     JOIN task t ON t.id = td.depends_on_id
     WHERE td.task_id = ?`,
    [taskId]
  );
  
  const incomplete = deps.filter(d => d.status !== 'completed');
  if (incomplete.length > 0) {
    return {
      isBlocked: true,
      blockingTasks: incomplete.map(t => t.title)
    };
  }
  return { isBlocked: false };
}
