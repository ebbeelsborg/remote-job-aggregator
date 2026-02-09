import { storage } from "./server/storage";

async function diag() {
  try {
    console.log("Fetching settings...");
    const s = await storage.getSettings();
    console.log("Current settings:", JSON.stringify(s, null, 2));

    console.log("Updating settings (fuzzy matching toggle)...");
    const newMode = s.harvestingMode === "fuzzy" ? "exact" : "fuzzy";
    const updated = await storage.updateSettings(s.id, { harvestingMode: newMode });
    console.log("Updated settings:", JSON.stringify(updated, null, 2));

    if (updated.harvestingMode === newMode) {
      console.log("SUCCESS: Settings updated correctly.");
    } else {
      console.log("FAILURE: Settings did not update.");
    }

    console.log("Testing whitelist update...");
    const testTitle = "diagnostic-test-" + Date.now();
    const withWhitelist = await storage.updateSettings(s.id, {
      whitelistedTitles: [...updated.whitelistedTitles, testTitle]
    });

    if (withWhitelist.whitelistedTitles.includes(testTitle)) {
      console.log("SUCCESS: Whitelist updated correctly.");
    } else {
      console.log("FAILURE: Whitelist did not update.");
    }

  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
  } finally {
    process.exit(0);
  }
}

diag();
