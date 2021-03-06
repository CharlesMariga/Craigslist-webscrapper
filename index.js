const fs = require("fs");

const request = require("requestretry").defaults({ fullResponse: false });
const cheerio = require("cheerio");

const options = {
  url: "https://sfbay.craigslist.org/search/sof",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36",
  },
};

const scrapeJobHeader = async () => {
  const scrapeResults = [];

  try {
    const htmlResult = await request(options);
    const $ = await cheerio.load(htmlResult);
    $(".result-info").each((index, el) => {
      const resultTitle = $(el).find(".result-title");
      const title = resultTitle.text();
      const url = resultTitle.attr("href");
      const datePosted = new Date($(el).children("time").attr("datetime"));
      const hood = $(el).find(".result-hood").text().trim();

      const scrapeResult = { title, url, datePosted, hood };
      scrapeResults.push(scrapeResult);
    });
    return scrapeResults;
  } catch (err) {
    console.log("Error 💣: ", err);
  }
};

const scrapeDescription = async (jobsWithHeaders) => {
  return await Promise.all(
    jobsWithHeaders.map(async (job) => {
      try {
        const htmlResult = await request({ ...options, url: job.url });
        const $ = await cheerio.load(htmlResult);
        $(".print-information").remove();
        const description = $("#postingbody").text();
        const mapBox = $(".viewposting");
        const address = [
          mapBox.attr("data-latitude"),
          mapBox.attr("data-longitude"),
        ];
        const compensation = $(".attrgroup")
          .children()
          .first()
          .text()
          .replace("compensation: ", "");

        return { ...job, description, address, compensation };
      } catch (err) {
        console.log(err.message);
      }
    })
  );
};

const scrapeCraigsList = async () => {
  const jobsWithHeaders = await scrapeJobHeader();
  const jobsFullData = await scrapeDescription(jobsWithHeaders);
  await fs.writeFile("./data.json", JSON.stringify(jobsFullData), (err) => {
    if (err) return console.log(err.message);
    console.log("Data written to file!");
  });
};

scrapeCraigsList();
