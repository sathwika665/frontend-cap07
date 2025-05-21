# Git Push Instructions

## Correct Working Directory
You should be in this folder:  
`PS C:\Users\Abhi\OneDrive\문서\BUS TRACKING>` ✅ **This is correct**  
Not in:  
`PS C:\Users\Abhi\OneDrive\문서\BUS TRACKING>BUSTRACKING>` ❌ **This is wrong**

If you're in the wrong folder, use:  
`cd ..`

---

## Branch Management
Once you're in the correct folder:  
`git status` → This should show either:  
- `On branch abhi-dev` or  
- `On branch main`

### Switching Branches
If you want to change from main to abhi-dev:  
`git checkout -b abhi-dev`

If you want to change from abhi-dev to main:  
`git checkout -b main`

---

## Pushing Changes
After setting up the correct branch:

1. Stage all changes:  
   `git add .`

2. Commit changes with a message:  
   `git commit -m "Your commit message here (better to give a good message)"`

3. Push to your desired branch:  
   - To push to main: `git push origin main`  
   - To push to abhi-dev: `git push origin abhi-dev`