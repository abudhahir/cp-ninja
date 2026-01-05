# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated building, testing, and releasing of the Copilot Ninja Skills extension.

## 🔄 Workflows Overview

### 1. **CI Build** (`ci.yml`)
**Triggers:** Push to main/master, Pull Requests
**Purpose:** Continuous Integration - validates code quality and builds

- **Multi-platform testing** (Ubuntu, Windows, macOS)
- **Multi-version Node.js** testing (18, 20)
- **TypeScript compilation** validation
- **Package validation** and VSIX creation
- **Security audit** checks
- **Skill files validation**

### 2. **Build and Release** (`release.yml`) 
**Triggers:** Push to main, Tags, Manual dispatch
**Purpose:** Automated version increment and release creation

- **Version auto-increment** (patch/minor/major)
- **VSIX package creation** with proper naming
- **GitHub Release creation** with changelog
- **Artifact upload** for distribution
- **Git tag management**

### 3. **Manual Release** (`manual-release.yml`)
**Triggers:** Manual workflow dispatch only
**Purpose:** On-demand releases with full control

- **Custom version specification** or auto-increment
- **Custom release notes** support
- **Pre-release** option available
- **Manual validation** before release

## 🚀 How to Use

### Automatic Releases
1. **Push to main branch** → Triggers automatic patch version increment and release
2. **Create version tag** (e.g., `git tag v1.2.3`) → Uses tag version for release
3. **Pull Request** → Runs CI validation only

### Manual Releases
1. Go to **Actions** tab in GitHub
2. Select **"Manual Release"** workflow  
3. Click **"Run workflow"**
4. Configure options:
   - **Version**: Specify exact version (e.g., `1.2.3`) or leave empty for auto-increment
   - **Release Type**: Choose `patch`, `minor`, or `major` for auto-increment
   - **Release Notes**: Add custom notes or leave empty for auto-generation
   - **Pre-release**: Check if this is a pre-release version

### Version Management

The workflows support multiple versioning strategies:

```bash
# Automatic version increment on main branch
git push origin main  # → 1.0.0 → 1.0.1 (patch)

# Manual version with tags
git tag v1.1.0
git push origin v1.1.0  # → Uses 1.1.0 exactly

# Manual workflow dispatch
# → Choose patch/minor/major or specify exact version
```

## 📦 Artifacts

Each successful build creates:

- **VSIX Package**: `cp-ninja-{version}.vsix` 
- **GitHub Release**: Tagged release with changelog
- **Artifacts**: Downloadable from Actions tab (90 days retention)

## 🔧 Configuration

### Required Secrets
- `GITHUB_TOKEN`: Automatically provided by GitHub (no setup needed)

### Optional Secrets (for VS Code Marketplace)
- `VSCE_PAT`: Personal Access Token for VS Code Marketplace publishing

### Environment Variables
All configuration is handled through:
- `package.json` version field
- Workflow input parameters  
- Git tags and commit messages

## 📋 Workflow Details

### CI Build Matrix
```yaml
Strategy:
  os: [ubuntu-latest, windows-latest, macos-latest]
  node-version: [18, 20]
```

### Version Increment Rules
- **Push to main**: Patch increment (`1.0.0` → `1.0.1`)
- **Manual with type**: Uses specified type (patch/minor/major)
- **Manual with version**: Uses exact version specified
- **Tag push**: Uses tag version exactly

### Release Notes Generation
- **Automatic**: Scans commits for `feat:`, `fix:`, `docs:`, `chore:` prefixes
- **Manual**: Uses custom notes from workflow input
- **Template**: Includes installation instructions and feature highlights

## 🛠️ Customization

### Adding New Checks
Edit `ci.yml` to add additional validation:
```yaml
- name: Custom Validation
  run: |
    # Your custom validation commands
    npm run custom-lint
    npm run security-check
```

### Modifying Release Process
Edit `release.yml` to customize:
- Version increment logic
- Release notes format
- Artifact names
- Publishing targets

### Marketplace Publishing
Uncomment the `publish` job in `release.yml` and configure `VSCE_PAT` secret.

## 🐛 Troubleshooting

### Common Issues

**Build fails on version increment:**
- Ensure main branch is not protected against force pushes by GitHub Actions
- Check that `GITHUB_TOKEN` has sufficient permissions

**VSIX package creation fails:**
- Verify `package.json` has all required VS Code extension fields
- Check that `vsce` can find all referenced files

**Release creation fails:**
- Ensure repository settings allow GitHub Actions to create releases
- Check that tag doesn't already exist

### Debug Steps
1. **Check workflow logs** in Actions tab
2. **Verify package.json** structure and dependencies  
3. **Test locally** with `npm run validate` and `npm run package`
4. **Review permissions** in repository settings

## 📊 Workflow Status

You can monitor workflow status through:
- **GitHub Actions tab**: Real-time progress and logs
- **README badges**: Add status badges to your README
- **Notifications**: Configure GitHub notifications for workflow results

---

These workflows provide a complete CI/CD pipeline for professional VS Code extension development with automated testing, versioning, and release management. 🚀