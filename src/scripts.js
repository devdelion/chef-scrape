const puppeteer = require('puppeteer');
const firebase = require("firebase/app");
require("firebase/database");



const heading = '.heading.heading-md.pt-18';
const value = '.dish-value';
const image = '.d-xl-none.dish-image';
const ingredients = '.dishComponent';
const ingredientName = '.dishComponent-name-text';
const ingredientAmount = '.dishComponent-info > *';
const ingredientImage = '.dishComponent-img';
const sel_steps = '.row.pb-24.pb-md-35.no-gutters';
const step_num = 'div.heading.heading-sm.mt-0.mt-md-24';
const step_descriptopn = 'div.mt-8.mt-md-16';
const step_image = '.dishRecipe-image';



const firebaseConfig = {
    apiKey: "AIzaSyCrE4_uOQ0Kuri8QU3L9EI7dfqnSUuYhaw",
    authDomain: "chefscreen-8f4b5.firebaseapp.com",
    databaseURL: "https://chefscreen-8f4b5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "chefscreen-8f4b5",
    storageBucket: "chefscreen-8f4b5.appspot.com",
    messagingSenderId: "289363552802",
    appId: "1:289363552802:web:f4e76b1c1352fc5635b87b"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();



(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({
        width: 1080,
        height: 720,
        deviceScaleFactor: 1,
    });

    await page.goto('https://www.chefmarket.ru');
    const cookie_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjbGllbnRfaWQiOiI4OWM0ZWE4Mi0wY2NhLTRkYzItOWQwNy00Njk4ZDdlMDU2MmMifQ.umZGAsrZ2wMPTinEa1JMg_9Ur4mHBt1flsSBus7zoHs'
    await page.setCookie({ "name": "token", "value": cookie_token });


    const base_link = 'https://www.chefmarket.ru/5dinners-';
    const links = ['original', 'family', '20minutes', 'balance'];
    for (link of links) {
        await page.goto(base_link + link);

        const selector = '.image .link-clear';
        const urls = await page.evaluate(selector => {
            const links = Array.from(document.querySelectorAll(selector));
            return links.map(link => link.href);
        }, selector);


        let dishes = {};
        for (const url of urls) {

            await page.goto(url);

            let dish = await page.evaluate((heading, value, image, ingredients, ingredientName, ingredientAmount, ingredientImage) => {
                const name = document.querySelector(heading).innerText.replace(/[\.\$\#\[\]\/]/g, ' ');
                const val = document.querySelector(value).innerText;
                const img = document.querySelector(image).style.backgroundImage.slice(4, -1).replace(/"/g, "");

                const ingr = {};
                Array.from(document.querySelectorAll(ingredients)).map(el => {
                    const name = el.querySelector(ingredientName).innerText.replace(/[\.\$\#\[\]\/]/g, ' ');
                    const amount = el.querySelector(ingredientAmount).innerText;
                    const img = el.querySelector(ingredientImage).style.backgroundImage.slice(4, -1).replace(/"/g, "");
                    ingr[name] = {
                        'ingredient-amount': amount, 'ingredient-img': img
                    }
                });

                return { 'name': name, 'value': val, 'image': img, 'ingredients': ingr };
            }, heading, value, image, ingredients, ingredientName, ingredientAmount, ingredientImage);


            const recipe = 'a[href="#recipe"]';
            await page.click(recipe);

            const dish_steps = await page.evaluate((sel_steps, step_num, step_descriptopn, step_image) => {
                const steps = {};
                Array.from(document.querySelectorAll(sel_steps)).map(step => {
                    const num = step.querySelector(step_num).innerText.replace(/[\.\$\#\[\]\/]/g, ' ');
                    const descr = step.querySelector(step_descriptopn).innerText;
                    const img = step.querySelector(step_image).style.backgroundImage.slice(4, -1).replace(/"/g, "");
                    steps[num] = {
                        'step-description': descr, 'step-img': img
                    };
                });

                return { 'steps': steps };
            }, sel_steps, step_num, step_descriptopn, step_image);

            database.ref('dishes/' + dish.name).set({
                'dish-value': dish.value, 'dish-image': dish.image, 'dish-ingredients': dish.ingredients, 'dish-steps': dish_steps.steps
            });

        }
    }


    await browser.close();
    await process.exit(1);
})();

