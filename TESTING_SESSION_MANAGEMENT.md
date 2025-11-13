# Testing Session Management

## Step 1: Start the Session Manager Server

Open a terminal and run:

```bash
cd packages/session-manager
pnpm dev
```

The server should start on `http://localhost:3001` and you should see:
```
🚀 Session Manager server running on port 3001
📡 WebSocket server ready for connections
```

Keep this terminal open - the server needs to be running for sessions to work.

## Step 2: Start the Electron App

In a **new terminal**, run:

```bash
pnpm dev
```

This will start both the Electron app and the React dev server.

## Step 3: Test Creating a Session

1. **Navigate to a webpage** - Enter any URL in the browser (e.g., `https://example.com`)
2. **Click "Create Session"** button in the URL bar
3. **Fill in the modal**:
   - Your Name: (e.g., "Owner")
   - Home URL: (should be pre-filled with current URL)
4. **Click "Create Session"**

**Expected Results:**
- ✅ Session panel should appear on the right side
- ✅ Shows "Session Active" with live indicator
- ✅ Shows share link (e.g., `tweaq://session/abc123`)
- ✅ Shows participant count (should be 1 - you)
- ✅ Duration counter starts counting

## Step 4: Test Copy Share Link

1. **Click "Copy" button** next to the share link
2. **Expected**: Button changes to "Copied" with checkmark
3. **Paste** the link somewhere to verify it copied correctly

## Step 5: Test Joining a Session (Second Instance)

To test joining, you'll need to simulate another user. You can either:

**Option A: Use the same app**
1. Click "Leave" button (if you're not the owner)
2. Click "Join" button
3. Enter the session ID from the share link
4. Enter a name (e.g., "Participant 1")
5. Click "Join Session"

**Option B: Extract session ID from share link**
- The share link format is: `tweaq://session/{sessionId}`
- Extract the `{sessionId}` part
- Use it in the Join modal

**Expected Results:**
- ✅ App navigates to the session's home URL
- ✅ You're now a participant (not owner)
- ✅ "Leave" button appears instead of session panel

## Step 6: Test Owner Features

**As Owner:**
1. **Check Session Panel** - Should show:
   - Duration counter
   - Participant count
   - Share link
   - List of participants
2. **End Session** - Click "End Session" button
   - Confirm the dialog
   - Expected: Session ends, panel disappears, alert shows comment count

## Step 7: Test URL Synchronization (Owner)

1. **As owner**, navigate to a different URL
2. **Expected**: All participants should automatically navigate to the same URL
   - (This requires multiple participants to fully test)

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use: `lsof -i :3001`
- Kill the process if needed: `kill -9 <PID>`

### Can't create session
- Make sure the session manager server is running
- Check browser console for errors
- Verify the server URL in `apps/desktop/electron/main.ts` (should be `http://localhost:3001`)

### Session panel not showing
- Make sure you're the owner (only owners see the panel)
- Check browser console for errors
- Verify session state: Open DevTools console and check `sessionState`

### WebSocket connection issues
- Check server logs for connection errors
- Verify CORS settings in `packages/session-manager/src/SessionManager.ts`
- Check firewall/network settings

## Quick Test Checklist

- [ ] Session manager server starts successfully
- [ ] Electron app starts successfully
- [ ] Can create a session
- [ ] Session panel appears for owner
- [ ] Share link can be copied
- [ ] Can join a session (using session ID)
- [ ] Can leave a session
- [ ] Owner can end session
- [ ] Session duration counter works
- [ ] Participant list updates (when multiple users)

## Next Steps After Testing

Once basic functionality works, we can add:
1. Real-time comment synchronization
2. Cursor tracking and display
3. Deep link handling (`tweaq://session/{id}`)
4. Comment ownership and permissions

