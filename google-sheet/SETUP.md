# Connect the app to a Google Sheet (one-time, about 5 minutes)

Every finished checklist adds one row to the sheet:

| Date | Name | Area | Routine | Started | Finished | Minutes | Steps done | Notes | Logged at | Run ID |
|---|---|---|---|---|---|---|---|---|---|---|

## 1. Create the sheet
1. Go to [sheets.new](https://sheets.new) and create a new Google Sheet.
2. Name it something like **Production Log**.

## 2. Add the script
1. In the sheet, open **Extensions → Apps Script**.
2. Delete the code that's already there.
3. Paste everything from [`Code.gs`](Code.gs) (in this folder).
4. Click **Save** 💾.

## 3. Deploy it as a web app
1. Click **Deploy → New deployment**.
2. Click the ⚙️ next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Google will ask you to authorize it:
   - Choose your account.
   - If you see "Google hasn't verified this app", click **Advanced → Go to (project name)**. This is normal for your own scripts.
   - Click **Allow**.
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy.../exec`.

To test it, open that URL in a browser. You should see `"Production log is running."`

## 4. Connect the app
Open [`data/config.js`](../data/config.js) and paste the URL:

```js
window.APP_CONFIG = {
  logEndpoint: "https://script.google.com/macros/s/AKfy.../exec",
};
```

Finish a checklist. The last screen should say **"✓ Saved to the production log"**, and a **Runs** tab with a new row should appear in your sheet.

## 5. Set your admin username and password
The admin page (`/admin.html`) shows every completed setup and breakdown, plus all notes. Its login is stored in your script's private settings, not in the website code.

1. In the Apps Script editor, click **Project Settings** ⚙️ in the left sidebar.
2. Scroll to **Script properties** and click **Add script property**. Add these two:

   | Property | Value |
   |---|---|
   | `ADMIN_USER` | the username you want, e.g. `leul` |
   | `ADMIN_PASSWORD` | a strong password, at least 12 characters |

3. Click **Save script properties**. You don't need to redeploy for this.

Then open `https://flash24la.github.io/production-checklist/admin.html` and sign in.

- After 5 wrong attempts, sign-in is blocked for 15 minutes.
- You stay signed in for up to 6 hours, or until you close the tab.
- To change your password, edit `ADMIN_PASSWORD` in the same place.
- The admin page isn't linked from the app. Bookmark it.

## Good to know
- **If you already deployed an older version of the script**, paste the new `Code.gs` over it and publish a new version as described in the next point. The admin page needs the new code.
- **If you edit `Code.gs` later**, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. That keeps the same URL. If you choose "New deployment" instead, you get a new URL and have to update `config.js`.
- **Offline is fine.** If a phone has no signal when someone finishes, the row is saved on the phone and sent the next time the app is opened online.
- **Only finished checklists are logged.** A run someone abandons halfway isn't recorded.
- **The URL is public.** Anyone who has it could add rows, so don't post it publicly. Text that looks like a formula is stored as plain text, so a fake row can't run anything in your sheet.
