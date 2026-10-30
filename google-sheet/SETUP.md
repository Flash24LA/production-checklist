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

## Good to know
- **If you edit `Code.gs` later**, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. That keeps the same URL. If you choose "New deployment" instead, you get a new URL and have to update `config.js`.
- **Offline is fine.** If a phone has no signal when someone finishes, the row is saved on the phone and sent the next time the app is opened online.
- **Only finished checklists are logged.** A run someone abandons halfway isn't recorded.
- **The URL is public.** Anyone who has it could add rows, so don't post it publicly. Text that looks like a formula is stored as plain text, so a fake row can't run anything in your sheet.
