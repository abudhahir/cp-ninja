# Packaged Skills Symlink & Log Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use cp-ninja:executing-plans to implement this plan task-by-task.

**Goal:**
Symlink all packaged skills into ~/.copilot/skills on install/update, and maintain a log in ~/.cp-ninja/logs for uninstall cleanup.

**Architecture:**
On plugin activation (install/update), enumerate all packaged skills, ensure ~/.copilot/skills exists, create/overwrite symlinks, and write/update a log file in ~/.cp-ninja/logs. On uninstall, read the log and remove all symlinks listed.

**Tech Stack:**
Node.js (fs/promises, path), VS Code extension API, cross-platform symlink handling.

---

### Task 1: Enumerate Packaged Skills

**Files:**
- Modify: src/ResourceManager.ts

**Step 1:** Implement function to list all skill directories in skills/.
**Step 2:** Write/extend tests to verify correct enumeration.
**Step 3:** Commit

---

### Task 2: Ensure ~/.copilot/skills Directory Exists

**Files:**
- Modify: src/ResourceManager.ts

**Step 1:** Add logic to check for and create ~/.copilot/skills if missing.
**Step 2:** Write/extend tests for directory creation.
**Step 3:** Commit

---

### Task 3: Create/Overwrite Symlinks for Each Skill

**Files:**
- Modify: src/ResourceManager.ts

**Step 1:** For each skill, create or overwrite a symlink in ~/.copilot/skills (cross-platform).
**Step 2:** Handle errors (permissions, conflicts) gracefully.
**Step 3:** Write/extend tests for symlink creation and overwriting.
**Step 4:** Commit

---

### Task 4: Write/Update Log File in ~/.cp-ninja/logs

**Files:**
- Modify: src/ResourceManager.ts
- Create: ~/.cp-ninja/logs/symlinks.log (if not present)

**Step 1:** Write/update a log file listing all symlinks created/updated (one entry per symlink: skill name, target path, timestamp).
**Step 2:** Write/extend tests for log creation and updates.
**Step 3:** Commit

---

### Task 5: Alert User on Symlink (Re)Creation

**Files:**
- Modify: src/extension.ts

**Step 1:** Add VS Code notification/output message when symlinks are created/updated and log is written.
**Step 2:** Write/extend tests for notification logic.
**Step 3:** Commit

---

### Task 6: Uninstall Cleanup Logic

**Files:**
- Modify: src/ResourceManager.ts or create uninstall handler

**Step 1:** On uninstall, read ~/.cp-ninja/logs/symlinks.log and remove all symlinks listed.
**Step 2:** Handle errors gracefully (missing symlinks, permissions).
**Step 3:** Write/extend tests for uninstall cleanup.
**Step 4:** Commit

---

**Plan complete and ready for execution.**
