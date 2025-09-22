# Smart QA GitHub Integration Setup

This guide will help you set up the GitHub integration for the Smart QA desktop application.

## Prerequisites

1. **GitHub OAuth App**: You need to create a GitHub OAuth App to get a Client ID
2. **Node.js and pnpm**: Make sure you have Node.js (v18+) and pnpm installed

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Smart QA Desktop
   - **Homepage URL**: `http://localhost` (or your preferred URL)
   - **Authorization callback URL**: `http://localhost` (device flow doesn't use this)
4. Click "Register application"
5. Copy the **Client ID** from the app settings page

## Step 2: Configure the Application

1. Open `/apps/desktop/electron/main.ts`
2. Replace `'your-github-oauth-app-client-id'` with your actual GitHub OAuth App Client ID:

```typescript
const GITHUB_CLIENT_ID = 'your_actual_client_id_here';
```

## Step 3: Install Dependencies

From the project root directory:

```bash
pnpm install
```

## Step 4: Build the Packages

Build the GitHub package:

```bash
cd packages/github
pnpm build
```

Build the desktop app:

```bash
cd ../../apps/desktop
pnpm build:electron-main
```

## Step 5: Run the Application

Start the development server:

```bash
pnpm dev
```

The application will open with the browser interface. Click the ⚙️ (settings) button in the top toolbar to access GitHub settings.

## Using the GitHub Integration

### 1. Connect to GitHub

1. Click the ⚙️ settings button in the toolbar
2. Click "Connect GitHub" button
3. Your default browser will open to GitHub's device authorization page
4. Enter the code displayed in the console/terminal
5. Authorize the Smart QA Desktop application
6. Return to the desktop app - you should see your GitHub profile

### 2. Configure Repository Settings

1. In the GitHub Settings screen, fill in:
   - **Owner**: The GitHub username or organization (e.g., `octocat`)
   - **Repository**: The repository name (e.g., `Hello-World`)
   - **Base Branch**: The default branch to create PRs against (e.g., `main`)
   - **Label**: The label to apply to test PRs (e.g., `design-qa`)

2. Click "Save Configuration"

### 3. Test the Integration

1. Click "Create Test PR" button
2. The app will:
   - Create a new branch with timestamp
   - Add a file at `smartqa/HELLO.md`
   - Create a pull request with the configured label
   - Display the PR URL and number

## GitClient API Usage

The `GitClient` class provides three main methods:

### `connectDeviceFlow()`

Initiates GitHub OAuth device flow authentication:

```typescript
const gitClient = new GitClient('your-client-id');
const authResult = await gitClient.connectDeviceFlow();
console.log('Authenticated as:', authResult.user.login);
```

### `ensureBranchAndCommit(options)`

Creates/updates a branch with files:

```typescript
await gitClient.ensureBranchAndCommit({
  owner: 'octocat',
  repo: 'Hello-World',
  base: 'main',
  branch: 'feature-branch',
  files: [
    {
      path: 'path/to/file.md',
      content: '# Hello World\n\nThis is the file content.'
    }
  ]
});
```

### `openPR(options)`

Creates a pull request:

```typescript
const pr = await gitClient.openPR({
  owner: 'octocat',
  repo: 'Hello-World',
  base: 'main',
  head: 'feature-branch',
  title: 'Add new feature',
  body: 'This PR adds a new feature.',
  labels: ['enhancement', 'design-qa']
});

console.log('PR created:', pr.url);
```

## Security Notes

- GitHub tokens are stored securely using the `keytar` library in the system keychain
- Tokens are automatically loaded on app restart
- Use the "Disconnect" button to clear stored credentials

## Troubleshooting

### Build Issues

If you encounter TypeScript build errors:

1. Make sure all packages are built in the correct order:
   ```bash
   cd packages/github && pnpm build
   cd ../../apps/desktop && pnpm build:electron-main
   ```

2. Clear and reinstall dependencies:
   ```bash
   rm -rf node_modules packages/*/node_modules apps/*/node_modules
   pnpm install
   ```

### Authentication Issues

- Make sure your GitHub OAuth App Client ID is correct
- Check that the device flow is completing successfully in the browser
- Verify that the app has the necessary permissions in your GitHub account

### Permission Issues

The app requires the following GitHub permissions:
- Read access to user profile
- Read/write access to repository contents
- Read/write access to pull requests
- Read/write access to issues (for labels)

## Development

To add new GitHub functionality:

1. Extend the `GitClient` class in `packages/github/src/client.ts`
2. Add IPC handlers in `apps/desktop/electron/main.ts`
3. Expose new methods in `apps/desktop/electron/preload.ts`
4. Update the React components to use the new functionality

The GitHub integration is designed to be extensible for future Smart QA features.
