const puppeteer = require('puppeteer');

//question you want to ask
const query = "error missing parantheses"

const queryWordArray = query.split(" ");
const queryUrl = `${query.replace(/ /g, "%20")}`;
const googleUrl = `https://www.google.com/search?q=${queryUrl}+site%3Astackoverflow.com`;

//function which scrapes the selected stackoverflow pages
const getAnswerFromQuestion = async (website, page) => {
    await page.goto(website, ["load", "domcontentloaded", "networkidle0"]);
    const question = await page.evaluate(() => document.querySelector('#question-header > h1 > a').innerText)

    const verifiedAnswer = await page.evaluate(() => {
        let answer_p_list = document.querySelector('div > div > div.answercell.post-layout--right > div.s-prose.js-post-body')
        let children = Array.from(answer_p_list.querySelectorAll('*'))
        let answer = ""
        let i = 0
        children.forEach((child) => {
            answer = answer + " " + child.innerText
        })
        return answer
    })

    console.log('\nQ:\n', question)
    console.log('\nAns:\n', verifiedAnswer)
}

(async () => {
    const browser = await puppeteer.launch()
    // {
    // headless: false
    // });
    const page = await browser.newPage();

    await page.goto(googleUrl, ["load", "domcontentloaded", "networkidle0"])

    const validUrls = await page.evaluate((queryUrl) => {
        const hrefElementsList = Array.from(
            document.querySelectorAll(
                `div[data-async-context='query:${queryUrl}%20site%3Astackoverflow.com'] a[href]`
            )
        );

        const filterElementsList = hrefElementsList.filter((elem) =>
            elem
                .getAttribute("href")
                .startsWith("https://stackoverflow.com/questions")
        );

        const stackOverflowLinks = filterElementsList.map((elem) =>
            elem.getAttribute("href")
        );

        return stackOverflowLinks;
    }, queryUrl)

    const keywordLikeability = [];
    //select those urls which contain atleast half of the words in the query
    validUrls.forEach((url) => {
        let wordCounter = 0;

        queryWordArray.forEach((word) => {
            if (url.indexOf(word) > -1) {
                wordCounter = wordCounter + 1;
            }
        });

        if (queryWordArray.length / 2 < wordCounter) {
            keywordLikeability.push({
                keywordMatch: wordCounter,
                url: url,
            });
        }
    });



    await (async function () {
        for (var i = 0; i < keywordLikeability.length; i++) {
            if (i < 4) {
                await getAnswerFromQuestion(
                    keywordLikeability[i].url,
                    page
                );
            }
        }

        await browser.close();
    })();
})()


