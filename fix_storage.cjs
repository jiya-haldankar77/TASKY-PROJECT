const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.vue') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            content = content.replace(/localStorage\.getItem\('tasky_token'\)/g, "sessionStorage.getItem('tasky_token')");
            content = content.replace(/localStorage\.setItem\('tasky_token'/g, "sessionStorage.setItem('tasky_token'");
            content = content.replace(/localStorage\.removeItem\('tasky_token'\)/g, "sessionStorage.removeItem('tasky_token')");
            
            content = content.replace(/localStorage\.getItem\('tasky_user'\)/g, "sessionStorage.getItem('tasky_user')");
            content = content.replace(/localStorage\.setItem\('tasky_user'/g, "sessionStorage.setItem('tasky_user'");
            content = content.replace(/localStorage\.removeItem\('tasky_user'\)/g, "sessionStorage.removeItem('tasky_user')");
            
            content = content.replace(/localStorage\.removeItem\('pm_auth_token'\)/g, "sessionStorage.removeItem('pm_auth_token')");
            content = content.replace(/localStorage\.removeItem\('pm_user_data'\)/g, "sessionStorage.removeItem('pm_user_data')");
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Done');
