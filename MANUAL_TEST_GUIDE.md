# Manual Test Guide - Audience Segmentation Feature
## User Flow Testing Instructions

**Feature**: Audience Segmentation
**Stage**: 6 - Final Validation
**Date**: 2026-02-16

---

## Prerequisites

1. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Server should be running at `http://localhost:3000`

2. **Test Database**: Ensure you have at least one active distributor account
3. **Browsers**: Test in Chrome, Firefox, Safari, and Edge
4. **Clear State**: Clear localStorage before each test flow for accurate results
   - Open DevTools → Application → Local Storage → Clear

---

## Flow 1: Corporate Visitor (Agent)

**Objective**: Verify agent can select their preference and see agent-focused content

### Steps:
1. Open `http://localhost:3000` in a fresh browser session
2. Wait for page to load completely
3. **Verify**: "Which Best Describes You?" choice section appears below hero
4. Click the **"I'm a Licensed Agent" (👔)** card
5. **Verify**: Choice section smoothly exits/disappears
6. **Verify**: Hero section content updates to agent-focused messaging
   - Look for: "Ready to Own Your Book and Earn What You're Worth?"
7. Scroll down to About section
8. **Verify**: About heading shows "Why Experienced Agents Choose Apex"
9. **Verify**: Sticky toggle bar appears at top after scrolling
   - Should show "Viewing as: 👔 Agent" with active button
10. Scroll down to Process section
11. **Verify**: Process title shows "How It Works for Licensed Agents"
12. **Verify**: Step 1 is "Transfer Your Book"
13. Scroll to CTA section
14. **Verify**: CTA heading is "Tired of Working for Someone Else's Dream?"

### Expected Behavior:
- ✅ All content is agent-focused throughout the page
- ✅ Toggle bar shows "Agent" as active
- ✅ No layout shift or flash of different content
- ✅ Smooth animations

---

## Flow 2: Corporate Visitor (Newcomer)

**Objective**: Verify newcomer can select their preference and see newcomer-focused content

### Steps:
1. Clear localStorage (DevTools → Application → Local Storage → Clear)
2. Refresh page or navigate to `http://localhost:3000`
3. Wait for page to load completely
4. **Verify**: Choice section appears
5. Click the **"I'm New to Insurance" (🌟)** card
6. **Verify**: Choice section exits smoothly
7. **Verify**: Hero section content updates to newcomer-focused messaging
   - Look for: "Start Your Career in Life Insurance—No Experience Needed"
8. Scroll down to About section
9. **Verify**: About heading shows "Your Path to a Profitable Insurance Career"
10. **Verify**: Toggle bar shows "Viewing as: 🌟 Newcomer" with active button
11. Scroll to Process section
12. **Verify**: Process title shows "Your Path from Zero to Licensed Agent"
13. **Verify**: Step 2 is "Get Licensed" with guidance text
14. Scroll to CTA section
15. **Verify**: CTA heading is "Ready to Build a Real Career?"

### Expected Behavior:
- ✅ All content is newcomer-focused throughout the page
- ✅ Toggle bar shows "Newcomer" as active
- ✅ Different messaging than agent flow
- ✅ Smooth animations

---

## Flow 3: Toggle Switching

**Objective**: Verify visitor can switch between agent and newcomer views

### Steps:
1. Complete Flow 1 or Flow 2 first (have a preference selected)
2. Scroll to top to see sticky toggle bar
3. Click the **opposite** preference button in toggle
   - If currently "Agent", click "Newcomer"
   - If currently "Newcomer", click "Agent"
4. **Verify**: Content throughout page updates immediately
5. **Verify**: Hero messaging changes
6. **Verify**: About section updates
7. **Verify**: Process section updates
8. **Verify**: CTA section updates
9. Switch back to original preference
10. **Verify**: Content switches back correctly

### Expected Behavior:
- ✅ Instant content updates (no page reload)
- ✅ No flashing or layout shift
- ✅ Toggle button shows correct active state
- ✅ All sections update consistently

---

## Flow 4: Preference Persistence

**Objective**: Verify preference persists across navigation and page refresh

### Steps:
1. Complete Flow 1 (select "Agent")
2. **Verify**: Toggle shows "Agent" as active
3. Open DevTools → Application → Local Storage → localhost:3000
4. **Verify**: Key `apex_audience_preference` exists with value `"agents"`
5. Navigate to another page (e.g., click logo, go to `/privacy`)
6. Navigate back to homepage
7. **Verify**: Still shows agent-focused content (no choice shown)
8. **Verify**: Toggle shows "Agent" as active
9. Refresh the page (F5 or Cmd+R)
10. **Verify**: After refresh, still shows agent content
11. **Verify**: No brief flash of choice cards
12. **Verify**: localStorage still has `"agents"` value

### Expected Behavior:
- ✅ Preference persists across navigation
- ✅ Preference persists across page refresh
- ✅ No hydration flash or choice re-appearing
- ✅ localStorage maintains value

---

## Flow 5: Replicated Page (Both)

**Objective**: Verify replicated page shows choice when distributor targets "both"

### Prerequisites:
- Create or use a distributor account with `target_audience = "both"`
- Username example: `johndoe`

### Steps:
1. Login to distributor account
2. Go to `/dashboard/profile`
3. Scroll to "Target Audience" section
4. **Verify**: "Both" option is selected (or select it)
5. Click "Save Preference" if changed
6. **Verify**: Success toast appears
7. Open new incognito/private window
8. Navigate to `http://localhost:3000/johndoe` (use actual username)
9. **Verify**: Page loads with distributor's name in header
10. **Verify**: Hero section shows default "both" messaging
11. **Verify**: "Which Best Describes You?" choice section appears
12. Select "Licensed Agent"
13. **Verify**: Content updates to agent-focused messaging
14. **Verify**: Toggle bar appears showing "Agent"
15. Scroll through entire page
16. **Verify**: All sections show agent-focused content

### Expected Behavior:
- ✅ Replicated page shows choice when distributor wants "both"
- ✅ Visitor can select their preference
- ✅ Content personalizes based on visitor choice
- ✅ Works same as corporate page for visitor

---

## Flow 6: Replicated Page (Agents Only)

**Objective**: Verify replicated page forces agent content when distributor targets agents only

### Prerequisites:
- Distributor account with `target_audience = "agents"`

### Steps:
1. Login to distributor account
2. Go to `/dashboard/profile`
3. Scroll to "Target Audience" section
4. Select **"Licensed Insurance Agents" (👔)**
5. Click "Save Preference"
6. **Verify**: Success toast appears
7. Open new incognito/private window
8. Navigate to distributor's replicated page
9. **Verify**: Page loads successfully
10. **Verify**: Hero shows agent-focused messaging immediately
11. **Verify**: NO "Which Best Describes You?" choice section appears
12. **Verify**: NO toggle bar appears (even after scrolling)
13. Scroll through entire page
14. **Verify**: About section: "Why Experienced Agents Choose Apex"
15. **Verify**: Process section: "How It Works for Licensed Agents"
16. **Verify**: CTA section: "Tired of Working for Someone Else's Dream?"

### Expected Behavior:
- ✅ No choice section shown
- ✅ No toggle bar shown
- ✅ All content is forced to agent-focused
- ✅ Visitor's localStorage preference is ignored

---

## Flow 7: Replicated Page (Newcomers Only)

**Objective**: Verify replicated page forces newcomer content when distributor targets newcomers only

### Prerequisites:
- Distributor account with `target_audience = "newcomers"`

### Steps:
1. Login to distributor account
2. Go to `/dashboard/profile`
3. Scroll to "Target Audience" section
4. Select **"People New to Insurance" (🌟)**
5. Click "Save Preference"
6. **Verify**: Success toast appears
7. Open new incognito/private window
8. Navigate to distributor's replicated page
9. **Verify**: Page loads successfully
10. **Verify**: Hero shows newcomer-focused messaging immediately
11. **Verify**: NO "Which Best Describes You?" choice section appears
12. **Verify**: NO toggle bar appears
13. Scroll through entire page
14. **Verify**: About section: "Your Path to a Profitable Insurance Career"
15. **Verify**: Process section: "Your Path from Zero to Licensed Agent"
16. **Verify**: CTA section: "Ready to Build a Real Career?"

### Expected Behavior:
- ✅ No choice section shown
- ✅ No toggle bar shown
- ✅ All content is forced to newcomer-focused
- ✅ Visitor's localStorage preference is ignored

---

## Flow 8: Profile Setting Change (Real-time)

**Objective**: Verify changing distributor preference updates replicated page immediately

### Steps:
1. Login to distributor account in **Tab 1**
2. Navigate to `/dashboard/profile`
3. Note current target_audience setting
4. Open **Tab 2** in same browser
5. Navigate to your replicated page in Tab 2
6. **Verify**: Content matches your current preference from Tab 1
7. In **Tab 1**, change target_audience setting:
   - If currently "Both", change to "Licensed Agents"
   - If currently "Agents", change to "Both"
8. Click "Save Preference"
9. **Verify**: Success toast in Tab 1
10. Switch to **Tab 2**
11. Refresh the replicated page
12. **Verify**: Content updates to match new preference
    - If changed to "Agents": No choice shown, all agent content
    - If changed to "Both": Choice section appears

### Expected Behavior:
- ✅ Changes save successfully
- ✅ Replicated page updates after revalidation
- ✅ Content matches new preference
- ✅ No errors or stale data

---

## Flow 9: Cross-Tab Synchronization

**Objective**: Verify visitor preference syncs across tabs

### Steps:
1. Clear localStorage
2. Open `http://localhost:3000` in **Tab 1**
3. Open `http://localhost:3000` in **Tab 2**
4. In **Tab 1**, select "Licensed Agent"
5. **Verify**: Tab 1 shows agent content
6. Switch to **Tab 2**
7. **Verify**: Tab 2 automatically updates to agent content (no refresh needed)
8. In **Tab 2**, use toggle to switch to "Newcomer"
9. Switch to **Tab 1**
10. **Verify**: Tab 1 automatically updates to newcomer content

### Expected Behavior:
- ✅ Changes in one tab sync to other tabs
- ✅ No page refresh needed
- ✅ storage event listener working correctly

---

## Flow 10: Private/Incognito Mode

**Objective**: Verify feature works in private browsing mode

### Steps:
1. Open new **Private/Incognito** window
2. Navigate to `http://localhost:3000`
3. **Verify**: Page loads without errors
4. **Verify**: Choice section appears
5. Select a preference
6. **Verify**: Content updates
7. Scroll and verify toggle appears
8. Switch preferences using toggle
9. **Verify**: Content updates
10. Check browser console
11. **Verify**: No localStorage errors (or only warnings, not errors)

### Expected Behavior:
- ✅ Feature works or degrades gracefully
- ✅ No JavaScript errors
- ✅ Content shows correctly
- ✅ If localStorage fails, defaults to "both" messaging

---

## Accessibility Testing

### Keyboard Navigation

**Steps**:
1. Navigate to homepage
2. Press **Tab** repeatedly
3. **Verify**: Focus moves to "Licensed Agent" card (visible focus ring)
4. Press **Enter** or **Space**
5. **Verify**: Agent preference is selected
6. **Verify**: Content updates
7. Press **Tab** to navigate to toggle
8. Press **Tab** to move between toggle buttons
9. Press **Enter** or **Space** on "Newcomer"
10. **Verify**: Content switches to newcomer

**Expected Behavior**:
- ✅ All interactive elements are keyboard accessible
- ✅ Focus indicators are clearly visible
- ✅ Enter and Space keys work on buttons
- ✅ Logical tab order

### Screen Reader

**Steps** (using NVDA, JAWS, or VoiceOver):
1. Enable screen reader
2. Navigate to homepage
3. **Verify**: Choice section is announced
4. **Verify**: Card descriptions are read correctly
5. **Verify**: Button roles are announced
6. Navigate through content
7. **Verify**: Headings are properly announced
8. **Verify**: Content hierarchy makes sense

**Expected Behavior**:
- ✅ Semantic HTML is used
- ✅ ARIA labels where needed
- ✅ Content is understandable via audio only

---

## Mobile Testing

### iOS Safari

**Steps**:
1. Open page on iPhone/iPad
2. **Verify**: Choice cards are large enough (tap targets ≥44x44px)
3. Tap a choice card
4. **Verify**: Tap is responsive, content updates
5. Scroll down
6. **Verify**: Toggle bar appears and is usable
7. Tap toggle buttons
8. **Verify**: Easy to tap, content switches
9. Test in portrait and landscape
10. **Verify**: Responsive layout, no horizontal scroll

### Android Chrome

**Steps**:
1. Open page on Android device
2. Repeat steps from iOS Safari
3. **Verify**: All functionality works
4. **Verify**: Touch targets are adequate
5. **Verify**: Performance is smooth

**Expected Behavior**:
- ✅ Touch targets ≥44x44px
- ✅ Smooth animations on mobile
- ✅ No horizontal scroll
- ✅ Responsive layout
- ✅ Works in portrait and landscape

---

## Browser Compatibility

### Test in Each Browser:

**Chrome**:
- [ ] Corporate page: Choice and toggle work
- [ ] Replicated page: All 3 modes work
- [ ] localStorage persists
- [ ] No console errors

**Firefox**:
- [ ] Corporate page: Choice and toggle work
- [ ] Replicated page: All 3 modes work
- [ ] localStorage persists
- [ ] No console errors

**Safari**:
- [ ] Corporate page: Choice and toggle work
- [ ] Replicated page: All 3 modes work
- [ ] localStorage persists
- [ ] No console errors
- [ ] Animations are smooth

**Edge**:
- [ ] Corporate page: Choice and toggle work
- [ ] Replicated page: All 3 modes work
- [ ] localStorage persists
- [ ] No console errors

---

## Performance Testing

### Lighthouse Audit

**Steps**:
1. Build production version:
   ```bash
   npm run build
   npm run start
   ```
2. Open `http://localhost:3000` in Chrome
3. Open DevTools → Lighthouse
4. Select: Performance, Accessibility, Best Practices, SEO
5. Select: Desktop
6. Click "Analyze page load"
7. **Verify**: All scores ≥90

**Repeat for**:
- Corporate page (/)
- Replicated page (/[username])

### Visual Stability (CLS)

**Steps**:
1. Open page
2. Watch during load
3. **Verify**: No layout shift when choice appears
4. **Verify**: No content jumping
5. Select a preference
6. **Verify**: Smooth exit animation
7. **Verify**: No layout shift after exit

**Expected Behavior**:
- ✅ CLS score ≈ 0
- ✅ No content jumping
- ✅ Smooth animations

---

## Error Scenarios

### Network Offline

**Steps**:
1. Open page with preference selected
2. Open DevTools → Network
3. Set throttling to "Offline"
4. Use toggle to switch preference
5. **Verify**: Toggle switches (localStorage still works)
6. **Verify**: Content updates (client-side only)

### Server Error

**Steps**:
1. Login to distributor account
2. Go to profile
3. Stop the dev server
4. Try to change target_audience
5. **Verify**: Error toast appears
6. **Verify**: No crash or white screen
7. Restart server
8. Try again
9. **Verify**: Works normally

---

## Checklist Summary

After completing all flows, verify:

- [ ] Flow 1: Corporate visitor (agent) ✅
- [ ] Flow 2: Corporate visitor (newcomer) ✅
- [ ] Flow 3: Toggle switching ✅
- [ ] Flow 4: Preference persistence ✅
- [ ] Flow 5: Replicated page (both) ✅
- [ ] Flow 6: Replicated page (agents only) ✅
- [ ] Flow 7: Replicated page (newcomers only) ✅
- [ ] Flow 8: Profile setting change ✅
- [ ] Flow 9: Cross-tab sync ✅
- [ ] Flow 10: Private/incognito mode ✅
- [ ] Accessibility: Keyboard navigation ✅
- [ ] Accessibility: Screen reader ✅
- [ ] Mobile: iOS Safari ✅
- [ ] Mobile: Android Chrome ✅
- [ ] Browser: Chrome ✅
- [ ] Browser: Firefox ✅
- [ ] Browser: Safari ✅
- [ ] Browser: Edge ✅
- [ ] Performance: Lighthouse ≥90 ✅
- [ ] Performance: No CLS ✅
- [ ] Error handling: Offline ✅
- [ ] Error handling: Server error ✅

---

## Reporting Issues

If you find any issues during testing:

1. Note the flow number and step
2. Describe expected vs actual behavior
3. Include browser and version
4. Include console errors if any
5. Include screenshots if helpful

---

**Testing Complete**: Date & Tester Name
**All Tests Passed**: Yes / No
**Issues Found**: [List or "None"]
