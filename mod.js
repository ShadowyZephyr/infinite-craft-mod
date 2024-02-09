// ==UserScript==
// @name         InfiniteCraft Mod
// @namespace    https://shadowyzephyr.github.io
// @version      1.3.4
// @description  mod
// @author       ShadowyZephyr
// @match        https://neal.fun/infinite-craft/
// @icon         https://shadowyzephyr.github.io/icon.png
// @grant        none
// ==/UserScript==


(function() {
let f = function() {
    //You must reset your progress for export paths to work properly, if you have played the game without using this script. (If you want it to work, run from console each time you open the game, or use TamperMonkey, so it saves all combinations)
    function createButton(text, bottom, color, f) {
        let button = document.createElement('button');
        button.textContent = text;
        button.style.position = 'absolute';
        button.style.left = '0.5%';
        button.style.bottom = bottom;
        button.style.backgroundColor = color;
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.cursor = 'pointer';
        button.addEventListener('click', f);
        return button;
    }
    const autoCraft = createButton("Auto Craft", "7%", 'green', run)
    document.body.appendChild(autoCraft);
    const autoCraftWithElem = createButton("Auto Craft With Element", "17%", "purple", run2)
    document.body.appendChild(autoCraftWithElem);
    const exporter = createButton("Export Path", "27%", 'blue', exportPath)
    document.body.appendChild(exporter);
    const importer = createButton("Import Path", "37%", 'orange', importPath)
    document.body.appendChild(importer);
    let pairs = [];
    const reset = document.getElementsByClassName("reset")[0];
    let lastFetch;
    let elements = document.getElementsByClassName("mobile-items")[0];
    let combinations = localStorage.getItem('combinations');
    let importUpdate = false;
    if (combinations === null || combinations === '') {
        combinations = {};
    } else {
        combinations = JSON.parse(combinations);
    }
    reset.onclick = function() {
        pairs = [];
        localStorage.setItem('combinations', '{}')
    }
    let running = false;
    let running2 = false;
    const fetchObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.initiatorType === "fetch") {
                let call = entry.name;
                call = call.split('=');
                call.shift();
                call[0] = call[0].substring(0, call[0].length - 7);
                lastFetch = call;
                importUpdate = true;
            }
        }
    });
    fetchObserver.observe({
        entryTypes: ["resource"]
    });
    function run() {
        if (autoCraft.style.backgroundColor === 'green') {
            autoCraft.style.backgroundColor = 'red';
            autoCraft.textContent = 'Stop Crafting';
        } else {
            autoCraft.style.backgroundColor = 'green';
            autoCraft.textContent = 'Auto Craft';
        }
        running = !running;
        if (running) {
            auto();
        }
    }
    function run2() {
        if (autoCraftWithElem.style.backgroundColor === 'purple') {
            autoCraftWithElem.style.backgroundColor = 'red';
            autoCraftWithElem.textContent = 'Stop Crafting';
        } else {
            autoCraftWithElem.style.backgroundColor = 'purple';
            autoCraftWithElem.textContent = 'Auto Craft With Element';
        }
        running2 = !running2;
        if (running2) {
            inputCraft(window.prompt('Input element to craft with (case-sensitive)'));
        }
    }
    const domObserver = new MutationObserver((mutations) => {
        setTimeout(() => {
            elements = document.getElementsByClassName("mobile-items")[0];
            const r = {discoveries: window.$nuxt.$root.$children[2].$children[0].$children[0]._data.discoveries, elements:window.$nuxt.$root.$children[2].$children[0].$children[0]._data.elements};
            const result = r.elements[r.elements.length-1].text;
            if (combinations[result] === undefined) {
                combinations[result] = [lastFetch[0], lastFetch[1]];
                localStorage.setItem('combinations', JSON.stringify(combinations)); 
            }
        }, 75);
    });
    const targetNode = document.querySelector('.instances','.sidebar');
    domObserver.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: false
    });
    async function auto() {
        running2 = false;
        autoCraftWithElem.style.backgroundColor = 'purple';
        autoCraftWithElem.textContent = 'Auto Craft With Element';
        let amount = elements.children.length;
        for (let sender = 0; sender < amount; sender++) {
            for (let receiver = 0; receiver < amount; receiver++) {
                if (pairs.includes(sender.toString() + receiver.toString()) || pairs.includes(receiver.toString() + sender.toString())) {
                    continue;
                }
                if (!running) {
                    await new Promise(r => setTimeout(r, 100));
                    return;
                }
                const x = elements.children[sender].children[0];
                const y = elements.children[receiver].children[0];
                x.click();
                y.click();
                pairs.push(sender.toString() + receiver.toString());
                while (x.classList.contains('item-selected-mobile')) {
                    await new Promise(r => setTimeout(r, 50));
                }
                await new Promise(r => setTimeout(r, 200)); // Could go faster but you get rate limited
            }
        }
        auto();
    }
    async function inputCraft(elem) {
        running = false;
        autoCraft.style.backgroundColor = 'green';
        autoCraft.textContent = 'Auto Craft';
        let amount = elements.children.length;
        for (let i = 0; i < amount - 1; i++) {
            if (!running2) {
                await new Promise(r => setTimeout(r, 100));
                return;
            }   
            const y = document.getElementById('item-' + elem)
            const x = elements.children[i].children[0];
            x.click();
            y.click();
            while (x.classList.contains('item-selected-mobile')) {
                await new Promise(r => setTimeout(r, 50));
            }
            await new Promise(r => setTimeout(r, 200)); // Could go faster but you get rate limited       
        }
        running2 = false;
        autoCraftWithElem.style.backgroundColor = 'purple';
        autoCraftWithElem.textContent = 'Auto Craft With Element';
    }
    function removeDuplicates(arr) {
        return [...new Set(arr)];
    }
    function getPath(elem) {
        let path = [];
        let unresolved = [elem];
        let starter = ['Water', 'Fire', 'Earth', 'Wind'];
        if (combinations[elem] === undefined) {
            throw new Error('No such element found in combinations list.');
        }
        while (unresolved.length > 0) {
            let e = decodeURIComponent(unresolved[0]);
            if (combinations[e] == undefined) {
                console.log('failed at' + e);
            }
            let c1 = decodeURIComponent(combinations[e][0]);
            let c2 = decodeURIComponent(combinations[e][1]);
            if (c1 === undefined || c2 === undefined) {
                return 0; // yes I know this is bad I'm lazy rn
            }
            if (!(starter.includes(c1)) && !(unresolved.includes(c1))) {
                unresolved.push(c1);
            }
            if (!(starter.includes(c2)) && !(unresolved.includes(c2))) {
                unresolved.push(c2);
            }
            unresolved.shift();
            path.push(c1 + ' + ' + c2 + ' = ' + e);
        }
        return removeDuplicates(path.reverse());
    }
    function exportPath() {
        let elem = window.prompt('Type element name (case-sensitive)');
        let toExport = '';
        const path = getPath(elem);
        if (path == 0) {
            return;
        }
        for (let i = 0; i < path.length; i++) {
            toExport = toExport + (i + 1).toString() + '. ' + path[i] + '\n';
        }
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(toExport));
        element.setAttribute('download', elem + '-path.txt');
   
        element.style.display = 'none';
        document.body.appendChild(element);
   
        element.click();
   
        document.body.removeChild(element);
    }
    function importPath() {
        const input = document.createElement('input');
        const reader = new FileReader();
        input.type = 'file';
        input.click();
        input.onchange = e => { 
            const file = e.target.files[0]; 
            reader.readAsText(file);
         }
        input.remove();
        reader.onload = e => {
            var path = reader.result;
            runPath(path);
        }
    }
    async function runPath(path) {
        const full = path.split('\n');
        for (let i = 0; i < full.length; i++) {
            const line = full[i];
            let text = line.split(".");
            text = text.slice(1).join(".");
            text = text.split(/[+=]/);
            if (document.getElementById('item-' + text[2].trim()) == null) {
                let elem1 = document.getElementById('item-' + text[0].trim());
                let elem2 = document.getElementById('item-' + text[1].trim());
                elem1.click();
                elem2.click();
                for(let j = 0; j < 20; j++) {
                    if (!importUpdate) {
                        await new Promise(r => setTimeout(r, 50));
                    }
                }
                await new Promise(r => setTimeout(r, 200));
                importUpdate = false;
            }
        }
    }        
}
window.addEventListener('load', f, false);
})();
