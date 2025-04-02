const fs = require("node:fs");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function getFinalTitleAndUrl(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const finalUrl = page.url();
    const title = await page.title();
    await browser.close();
    return { title, finalUrl };
  } catch (error) {
    await browser.close();
    return { error: "Error loading the page" };
  }
}

async function processSlot(i, slotsArr) {
  const url = `https://static-stg.hacksawgaming.com/launcher/static-launcher.html?channel=desktop&gameid=${i}&partner=stg&mode=demo&token=123`;

  try {
    const result = await getFinalTitleAndUrl(url);

    if (result.title != "Hacksaw Gaming") {
      slotsArr.push({
        id: i,
        name: result.title,
        code: result.title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        url: url,
      });
      console.log(`Game found id=${i}: ${result.title}`);
    } else {
      console.error(`No game found id=${i}`);
    }
  } catch (error) {
    console.error(`${error} id=${i}`);
  }

  return slotsArr;
}

async function fetchSlots() {
  const slotsArr = [];
  // Approximated games' ids range
  for (let i = 1841; i >= 1840; i--) {
    await processSlot(i, slotsArr);
  }

  return slotsArr;
}

fetchSlots().then((finalResults) => {
  console.log("Completed");
  fs.writeFile("../output/output.json", JSON.stringify(finalResults), (err) => {
    if (err) return console.error(err);
  });
});

// // Filter duplicates - Uncomment to use

// const data = fs.readFileSync("../output/output.json", "utf8");
// const jsonData = JSON.parse(data);
// function removeDuplicates(data, key) {
//   const seen = new Set();
//   return data.filter((item) => {
//     if (seen.has(item[key])) {
//       return false;
//     }
//     seen.add(item[key]);
//     return true;
//   });
// }
// var newData = "";
// newData = JSON.stringify(removeDuplicates(jsonData, "name"));
// fs.writeFile("outputFiltered.json", newData, (error) => {
//   if (error) return console.log(error);
// });
