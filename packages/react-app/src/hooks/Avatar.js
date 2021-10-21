import { ConsoleSqlOutlined } from "@ant-design/icons";
import { load } from "dotenv";
import { doc } from "prettier";
import { useRef, useEffect, useState } from "react";
import rwc from 'random-weighted-choice'

/*
  ~ What it does? ~

  Loads the avatar images from public/avatars/avatarimages.ora
  Creates a new random avatar given certain parameters

  ~ How can I use? ~

  const avatarImage = useAvatar(); <- returns a random avatar with json info

  ~ Features ~

  - Coming Soon -

*/

export const canvasWidth = 400;
export const canvasHeight = 400;
const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
const all = require("it-all");

var dataParts = [];
var tempLootText = [];
var colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF", "#FFA500", "#FF69B4", "#DAA520", "#B22222", "#F0FFF0", "#C0C0C0", "#00FF00", "#808000", "#FF6347"];

const useAvatar = props => {
    // load jsora and lodash
    const jsora = window.jsora;
    const _ = window._;
    const project = new jsora.JSOra();
    var rend;

    const [randomConfig, setRandomConfig] = useState({ Root: {} });
    const [mintingConfig, setMintingConfig] = useState({
        amountToCreate: 2,
        description: "An avatar for the open metaverse!",
        external_url: "https://kernel.community/en/track-gaming/module-1",
        initialized: false,
    });
    const [partsList, setPartsList] = useState({ PartsList: {} });

    const [lootText, setLootText] = useState([])

    const [metadataJson, setMetadataJson] = useState({ tokenMetadata: {} });

    const [uploadedTokenURI, setUploadedTokenURI] = useState({ tokenURI: {} });

    const [ipfsHash, setIpfsHash] = useState();

    const canvasRef = useRef(null);

    const [infoDataParts, setInfoDataParts] = useState([]);
    const [holdDataParts, setHoldDataParts] = useState([]);

    var tempPartsList = { PartsList: {} };

    var requiredPartsList = [];

    const [classOptions, setClassOptions] = useState([]);
    const [selectedClass, setSelectedClass] = useState([]);
    const [configTree, setConfigTree] = useState([]);

    var currentRandomConfig = {};
    var currentTreeConfig = [];

    useEffect(() => {
        if (selectedClass.length <= 0) {
            getAvatar();
        }
        else {
            reloadConfig();
        }
    }, [selectedClass]);

    useEffect(() => {
        updateTreeData();
    }, [randomConfig]);


    const updateTreeData = async () => {
        if (randomConfig.children !== undefined) {
            var children = Array.from(randomConfig);
            setConfigTree(children);
        }
    }

    const loadProject = async (fileLocation) => {
        if (fileLocation instanceof Blob === false) {
            console.log("Loading default file");
            let loaded_file = await fetch(`avatars/avatarimages.ora`).then(r => r.blob());
            await project.load(loaded_file);
        }
        else {
            console.log("Loading specified file");
            await project.load(fileLocation);
        }
    };

    async function drawAvatarFromMetadata(metadata, index, amountToCreate) {
        setRandomConfig({ Root: {} });

        // unhide project layers according to metadata
        await refreshProjectLayers(project, metadata);

        const ipfsHash = await drawMiniAvatar(index + 1, amountToCreate, true);

        return ipfsHash;
    }

    async function refreshProjectLayers(project, metadata) {
        recurseOverMetadata(project, "Root", metadata);
    }

    function recurseOverMetadata(obj, parent, metadata) {
        for (let child of obj.children) {
            var fullName = parent + "." + child.name;

            if (child.children != undefined) {
                recurseOverMetadata(child, fullName, metadata);
            } else {
                // unhide layers specified in metadata
                if (_.get(metadata, parent) == child.name) {
                    child.hidden = false;
                } else {
                    child.hidden = true;
                }
            }
        }
    }

    const startIPFSUpload = async () => {
        console.log("startIPFS");
        await loadProject();
        rend = new jsora.Renderer(project);

        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        var tokenMetadata = metadataJson.tokenMetadata;

        var files = [];
        var tokenURIArray = [];

        const IMAGE_BASE_URI = "https://ipfs.io/ipfs/";
        const NAME_BASE = "Avatar ";

        // redraw avatar from metadata json
        for (var i = 0; i < tokenMetadata.length; i++) {
            var ipfsHash = await drawAvatarFromMetadata(tokenMetadata[i], i, tokenMetadata.length);

            // move token metadata to attributes (for opensea)
            var attrib = tokenMetadata[i].Root;

            // generate the token URI
            var tokenURI = {
                name: NAME_BASE + (i + 1),
                description: mintingConfig.description,
                external_url: mintingConfig.external_url,
                image: IMAGE_BASE_URI + ipfsHash,
                attributes: attrib,
            };

            tokenURIArray.push(tokenURI);

            var tempTokenURI = {
                tokenURI: tokenURIArray,
            };

            setUploadedTokenURI(tempTokenURI);

            files.push({
                path: "/tmp/" + (i + 1),
                content: JSON.stringify(tokenURI),
            });
        }

        const cid = (await all(ipfs.addAll(files))).pop().cid.string;

        setIpfsHash(cid);
    };

    const reloadConfig = async (reloadParam) => {
        console.log("reloadConfig", reloadParam);
        await loadProject(reloadParam);
        await getAvatarConfiguration(project);
        setRandomConfig(currentRandomConfig);
    }

    const getAvatar = async (getParam) => {
        currentRandomConfig = { Root: {} };

        console.log("getAvatar", getParam);
        await loadProject(getParam);
        await getBaseClasses();  // reinits

        rend = new jsora.Renderer(project);
        await getAvatarConfiguration(project);
        await hideLayersRecursively(project, "Root");
        await randomizeHiddenParts();
        setRandomConfig(currentRandomConfig);
        await drawAvatar();

        setLootText(tempLootText);
    };

    function getBaseClasses() {
        var tempBaseClassArray = [];

        for (let child of project.children) {
            if (child.name.includes("CLASS")) {
                var classOption = {
                    name: child.name,
                    children: getBaseClassesRecursively(child)
                }
                tempBaseClassArray.push(classOption);
            }
        }

        refreshClassOptions(tempBaseClassArray);
    }

    function getBaseClassesRecursively(obj) {
        var tempBaseClassArray = [];

        for (let child of obj.children) {
            if (child.name.includes("CLASS")) {
                var classOption = {
                    name: child.name,
                    children: getBaseClassesRecursively(child)
                }
                tempBaseClassArray.push(classOption);
            }
        }

        return tempBaseClassArray;
    }

    function hideLayersRecursively(obj, parent) {
        for (let child of obj.children) {
            child.hidden = !child.name.includes("UNIVERSAL");

            if (child.children != undefined) {
                hideLayersRecursively(child, parent + "." + child.name);
            }
        }
    }


    function changeAvatarColor(paramArray, lastTime) {
        const canvas1 = canvasRef.current;
        const ctx1 = canvas1.getContext("2d");
        var newCanvas = { width: 400, height: 400 };

        ctx1.clearRect(0, 0, newCanvas.width, newCanvas.height);
        paramArray.sort((a, b) => a.zIndex - b.zIndex);
        setInfoDataParts([...paramArray]);
        for (let i = 0; i < paramArray.length; i++) {
            let currentImg = new Image(newCanvas.width, newCanvas.height);
            currentImg.src = paramArray[i].value;
            currentImg.onload = function () {
                const currentCanvas = document.createElement('canvas');
                currentCanvas.setAttribute("id", "currentCanvas" + i.toString());
                const currentContext = currentCanvas.getContext("2d");
                currentCanvas.width = newCanvas.width;
                currentCanvas.height = newCanvas.height;
                currentContext.clearRect(0, 0, newCanvas.width, newCanvas.height);
                if (paramArray[i].type === "selected") {
                    currentContext.drawImage(currentImg, paramArray[i].offsetX, paramArray[i].offsetY);
                }
                else {
                    currentContext.drawImage(currentImg, 0, 0);
                }

                currentContext.globalCompositeOperation = "source-atop";
                currentContext.fillStyle = paramArray[i].color;

                currentContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
                currentContext.globalCompositeOperation = "source-over";

                ctx1.globalCompositeOperation = "source-over";
                if (paramArray[i].type === "selected") {
                    ctx1.drawImage(currentImg, paramArray[i].offsetX, paramArray[i].offsetY);
                }
                else {
                    ctx1.drawImage(currentImg, 0, 0);
                }

                ctx1.globalCompositeOperation = "color";
                ctx1.drawImage(currentCanvas, 0, 0);

                currentCanvas.remove();

                if (i === paramArray.length - 1) {
                    console.log(Date.now() - lastTime);
                }
            }
        }
    }


    async function drawAvatar() {
        const canvas1 = canvasRef.current;
        const ctx1 = canvas1.getContext("2d");
        var newCanvas = await renderAvatar();

        ctx1.clearRect(0, 0, newCanvas.width, newCanvas.height);

        ctx1.drawImage(newCanvas, 0, 0);

        /*
        //var newCanvas = { width: 400, height: 400 };

        dataParts.sort((a, b) => a.zIndex - b.zIndex);
        for (let i = 0; i < dataParts.length; i++) {
            let currentImg = new Image(newCanvas.width, newCanvas.height);
            currentImg.src = dataParts[i].value;
            currentImg.onload = function () {
                const currentCanvas = document.createElement('canvas');
                currentCanvas.setAttribute("id", "currentCanvas" + i.toString());
                const currentContext = currentCanvas.getContext("2d");
                currentCanvas.width = newCanvas.width;
                currentCanvas.height = newCanvas.height;
                currentContext.clearRect(0, 0, newCanvas.width, newCanvas.height);
                if (dataParts[i].type === "selected") {
                    currentContext.drawImage(currentImg, paramArray[i].offsetX, paramArray[i].offsetY);
                }
                else {
                    currentContext.drawImage(currentImg, 0, 0);
                }
                currentContext.globalCompositeOperation = "source-atop";
                currentContext.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                dataParts[i].color = currentContext.fillStyle;
                setInfoDataParts([...dataParts]);

                currentContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
                currentContext.globalCompositeOperation = "source-over";

                ctx1.globalCompositeOperation = "source-over";
                if (dataParts[i].type === "selected") {
                    ctx1.drawImage(currentImg, paramArray[i].offsetX, paramArray[i].offsetY);
                }
                else {
                    ctx1.drawImage(currentImg, 0, 0);
                }
                ctx1.globalCompositeOperation = "color";
                ctx1.drawImage(currentCanvas, 0, 0);

                currentCanvas.remove();
            }
        }*/

    }

    async function setNewAvatar(newParam) {
        dataParts.length = 0;
        await getAvatar(newParam);
        return randomConfig;
    }

    function toBlobWrapper(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                async blob => {
                    var result = await ipfs.add(blob);
                    resolve(result);
                },
                errorResponse => {
                    reject(errorResponse);
                },
            );
        });
    }

    async function drawMiniAvatar(i, amountToCreate, uploadToIPFS) {
        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext("2d");
        const MAX_PER_ROW = Math.ceil(Math.sqrt(amountToCreate));

        var index = i - 1;
        var TOTAL_ROWS = amountToCreate / MAX_PER_ROW;
        var x = index % MAX_PER_ROW;
        var y = Math.floor(index / MAX_PER_ROW);
        var width = canvasWidth / MAX_PER_ROW;
        var height = canvasHeight / TOTAL_ROWS;

        var dx = x * width;
        var dy = y * height;

        // console.log(index + "," + x + ", " + y + "," + dx + ", " + dy + ", " + width + ", " + height);

        var newCanvas = await renderAvatar();

        if (uploadToIPFS) {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(newCanvas, 0, 0, canvasWidth, canvasHeight);

            const result = await toBlobWrapper(newCanvas);

            if (result && result.path) {
                return result.path;
            }
        } else {
            ctx.drawImage(newCanvas, 0, 0, canvasWidth, canvasHeight, dx, dy, width, height);

            return null;
        }
    }

    async function getNewAvatarMetadata() {
        // await randomizeHiddenParts();
        // await getAvatarConfiguration(project);

        var randomClass = getRandomClasses();
        console.log(randomClass);

        //setRandomConfig({ Root: {} });
        // setRandomConfig({ Root: {} });

        await getAvatarConfiguration(project, randomClass);
        await hideLayersRecursively(project, "Root");
        await randomizeHiddenParts(selectedClass);

        setRandomConfig(currentRandomConfig);

    }

  const randomShuffle = arr => {
    if (!Array.isArray(arr)) {
      return;
    }
    let currentIndex = arr.length;
    let randomIndex = 0;

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
  };

  // weightdChoices must be an array of objects with 'weight' property,
  // if 'weight' missing, randomizes as if all objects have equal weight
  const prepareWeightedArray = (weightdChoices, neededLength) => {
    const totalWeight = weightdChoices.reduce((accum, curr) => accum + (curr.weight || 1));
    const adjustedBgWeight = Math.floor(neededLength / totalWeight);
    const ret = [];
    for (let i = 0; i < weightdChoices.length; i++) {
      const object = weightdChoices[i];
      const count = object.weight * adjustedBgWeight;
      for (let ii = 0; ii < count; ii++) {
        ret.push(object);
      }
    }
    // fill up with simple randoms, because flooring adjustedBgWeight,
    // total length may be lesser than needed
    while (ret.length < neededLength) {
      ret.push(weightdChoices[Math.floor(Math.random() * weightdChoices.length)]);
    }
    randomShuffle(ret);
    return ret;
  };

  async function generateMetadataJson(mintingConfigJSON) {
    console.log("generateMetadataJsonNew");
    if (!mintingConfigJSON.initialized) {
      return {
        filename: "metadata.json",
      };
    }
    const amountToCreate = mintingConfigJSON.amountToCreate;
    const mintArray = [];

    const currentParts = JSON.parse(localStorage.getItem("myParts"));
    const backgrounds = [];

    // YP: avatarsnew.ora has this nested background structure, flatten here
    _.forOwn(currentParts["Background UNIVERSAL"], value => {
      if (Array.isArray(value)) {
        backgrounds.push(...value)
      } else {
        _.forOwn(value, valval => {
          if (Array.isArray(valval)) {
            backgrounds.push(...valval);
          }
        });
      }
    });
    // rwc needs "id"
    backgrounds.forEach(bg => (bg.id = bg.name))

    const femaleParts = Object.keys(currentParts["CLASS female"]);
    let femaleClasses = [];
    let femaleBasics = [];
    for (let i = 0; i < femaleParts.length; i++) {
      if (femaleParts[i].includes("CLASS")) {
        const currentObj = currentParts["CLASS female"][femaleParts[i]];
        currentObj.name = femaleParts[i];
        femaleClasses.push(currentObj);
      } else {
        const currentObj = {};
        currentObj.parts = currentParts["CLASS female"][femaleParts[i]];
        currentObj.name = femaleParts[i];
        femaleBasics.push(currentObj);
      }
    }
    // filter out incorrect ora values
    femaleClasses = femaleClasses.filter(obj => !Array.isArray(obj) && !!obj.name);
    femaleBasics = femaleBasics.filter(obj => !Array.isArray(obj) && Array.isArray(obj.parts) && !!obj.name);

    const maleParts = Object.keys(currentParts["CLASS male"]);
    let maleClasses = [];
    let maleBasics = [];
    for (let i = 0; i < maleParts.length; i++) {
      if (maleParts[i].includes("CLASS")) {
        const currentObj = currentParts["CLASS male"][maleParts[i]];
        currentObj.name = maleParts[i];
        maleClasses.push(currentObj);
      } else {
        const currentObj = {};
        currentObj.parts = currentParts["CLASS male"][maleParts[i]];
        currentObj.name = maleParts[i];
        maleBasics.push(currentObj);
      }
    }
    // filter out incorrect ora values
    maleClasses = maleClasses.filter(obj => !Array.isArray(obj) && !!obj.name);
    maleBasics = maleBasics.filter(obj => !Array.isArray(obj) && Array.isArray(obj.parts) && !!obj.name);

    const femaleAvatarsCount = Math.ceil(amountToCreate / 2);
    const maleAvatarsCount = amountToCreate - femaleAvatarsCount;

    // Female:
    const randomFemaleBackgrounds = prepareWeightedArray(backgrounds, femaleAvatarsCount);
    const randomFemaleClasses = prepareWeightedArray(femaleClasses, femaleAvatarsCount);
    // assuming here that classes are not weighted:
    const eachFemaleClassCount = Math.ceil(femaleAvatarsCount / femaleClasses.length)
    femaleClasses.forEach(cls => {
      _.forOwn(cls, (value, key) => {
        if (key === "name") {
          return;
        }
        cls[key] = prepareWeightedArray(cls[key], eachFemaleClassCount);
      });
      cls.generatedCount = 0;
    });

    for (let i = 0; i < femaleAvatarsCount; i++) {
      const chosenBg = randomFemaleBackgrounds[i];
      const chosenClass = randomFemaleClasses[i];

      const avatar = {
        name: chosenClass.name,
        base: femaleBasics[2].parts[0], // ?
        background: chosenBg,
      };
      _.forOwn(chosenClass, (value, key) => {
        if (key === "name" || key === "generatedCount") {
          return;
        }
        avatar[key] = chosenClass[key][chosenClass.generatedCount];
      });
      chosenClass.generatedCount += 1;
      mintArray.push(avatar);
    }

    // Male:
    const randomMaleBackgrounds = prepareWeightedArray(backgrounds, maleAvatarsCount);
    const randomMaleClasses = prepareWeightedArray(maleClasses, maleAvatarsCount);
    // assuming here that classes are not weighted:
    const eachMaleClassCount = Math.ceil(maleAvatarsCount / maleClasses.length)
    maleClasses.forEach(cls => {
      _.forOwn(cls, (value, key) => {
        if (key === "name") {
          return;
        }
        cls[key] = prepareWeightedArray(cls[key], eachMaleClassCount);
      });
      cls.generatedCount = 0;
    });

    for (let i = 0; i < maleAvatarsCount; i++) {
      const chosenBg = randomMaleBackgrounds[i];
      const chosenClass = randomMaleClasses[i];

      const avatar = {
        name: chosenClass.name,
        base: maleBasics[2].parts[0], // ?
        background: chosenBg,
      };
      _.forOwn(chosenClass, (value, key) => {
        if (key === "name" || key === "generatedCount") {
          return;
        }
        avatar[key] = chosenClass[key][chosenClass.generatedCount];
      });
      chosenClass.generatedCount += 1;
      mintArray.push(avatar);
    }

    const ret = {
      tokenMetadata: mintArray,
    }

    const myAvatars = JSON.parse(localStorage.getItem('myAvatars'));
    myAvatars.push(ret);
    localStorage.setItem('myAvatars', JSON.stringify(myAvatars));
    const currentAvatars = JSON.parse(localStorage.getItem('myAvatars'));
    console.log(`Now we have ${currentAvatars.length} avatars!`);

    setMetadataJson(ret);
    return ret;
  }

  async function oldGenerateMetadataJson(mintingConfigJSON) {
    if (mintingConfigJSON.initialized) {
        var amountToCreate = mintingConfigJSON.amountToCreate;
        var mintArray = [];
        console.log("generateMetadaJson");
        let currentParts = JSON.parse(localStorage.getItem('myParts'));
        let backgrounds = currentParts["Background UNIVERSAL"];
        let femaleParts = Object.keys(currentParts["CLASS female"]);
        let femaleClasses = [];
        let femaleBasics = [];
        for (let i = 0; i < femaleParts.length; i++) {
            if (femaleParts[i].includes("CLASS")) {
                let currentObj = currentParts["CLASS female"][femaleParts[i]];
                currentObj.name = femaleParts[i];
                femaleClasses.push(currentObj);
            }
            else {
                let currentObj = {};
                currentObj.parts = currentParts["CLASS female"][femaleParts[i]];
                currentObj.name = femaleParts[i];
                femaleBasics.push(currentObj);
            }
        }
        let maleParts = Object.keys(currentParts["CLASS male"]);
        let maleClasses = [];
        let maleBasics = [];
        for (let i = 0; i < maleParts.length; i++) {
            if (maleParts[i].includes("CLASS")) {
                let currentObj = currentParts["CLASS male"][maleParts[i]];
                currentObj.name = maleParts[i];
                maleClasses.push(currentObj);
            }
            else {
                let currentObj = {};
                currentObj.parts = currentParts["CLASS male"][maleParts[i]];
                currentObj.name = maleParts[i];
                maleBasics.push(currentObj);
            }
        }
        for (var i = 1; i <= amountToCreate; i++) {
            let rBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
            let rClass = Math.random() > 0.5 ? femaleClasses[Math.floor(Math.random() * femaleClasses.length)]
                : maleClasses[Math.floor(Math.random() * maleClasses.length)];
            let fillParts = {};
            fillParts.name = rClass.name;
            fillParts.base = rClass.name.includes("female") ? femaleBasics[2].parts[0] : maleBasics[2].parts[0];
            fillParts.background = rBackground;
            for (let prop in rClass) {
                if (prop !== "name") {
                    fillParts[prop] = rClass[prop][Math.floor(Math.random() * rClass[prop].length)];
                }
            }
            let allProps = Object.assign({}, fillParts);
            mintArray.push(allProps);
            var tempMetadataJson = {
                tokenMetadata: mintArray,
            };
            setMetadataJson(tempMetadataJson);
        }
        let myAvatars = JSON.parse(localStorage.getItem('myAvatars'));
        myAvatars.push(tempMetadataJson);
        localStorage.setItem('myAvatars', JSON.stringify(myAvatars));
        let currentAvatars = JSON.parse(localStorage.getItem('myAvatars'));
        console.log(`Now we have ${currentAvatars.length} avatars!`);
        return tempMetadataJson;
    } else {
        return {
            filename: "metadata.json",
        };
    }
}

    function finalRender(paramArray, paramCount) {
        const canvas1 = canvasRef.current;
        const ctx1 = canvas1.getContext("2d");
        var newCanvas = { width: 400, height: 400 };
        ctx1.clearRect(0, 0, newCanvas.width, newCanvas.height);

        let loadedImages = [];
        let controlCounter = 0;

        for (let i = 0; i < paramArray.length; i++) {
            let currentImg = new Image(newCanvas.width, newCanvas.height);
            currentImg.src = paramArray[i].value;
            currentImg.onload = function () {
                let controlImage = {};
                controlImage.zIndex = paramArray[i].zIndex;
                controlImage.image = currentImg;
                controlImage.offsetX = paramArray[i].offsetX;
                controlImage.offsetY = paramArray[i].offsetY;
                controlImage.type = paramArray[i].type;
                loadedImages.push(controlImage);
                controlCounter += 1;
                if (controlCounter === paramArray.length) {
                    //console.log("LOADED ALL PICS");
                    loadedImages.sort((a, b) => a.zIndex - b.zIndex);
                    for (let loadedImg = 0; loadedImg < loadedImages.length; loadedImg++) {
                        if (loadedImages[loadedImg].type === "selected") {
                            ctx1.drawImage(loadedImages[loadedImg].image, loadedImages[loadedImg].offsetX, loadedImages[loadedImg].offsetY);
                        }
                        else {
                            ctx1.drawImage(loadedImages[loadedImg].image, 0, 0);
                        }
                    }
                    //console.log(loadedImages);
                    let downloadLink = document.getElementById("currentdownload");
                    downloadLink.setAttribute("download", "arcadian" + paramCount + ".png")
                    let myIMG = canvas1.toDataURL("image/png").replace("image/png", "image/octet-stream");
                    downloadLink.setAttribute("href", myIMG);
                    downloadLink.click();
                    window.nextRender = true;
                    if (paramCount >= 99) {
                        alert("Exported all avatars.");
                    }
                }
            }
        }
    }

    async function getMintingConfig() {
        console.log("getMintingConfig");
        await loadProject();

        await getAllPartsJson(project);

        var newConfig = _.merge(mintingConfig, tempPartsList);
        newConfig.initialized = true;

        setPartsList(tempPartsList);
        setMintingConfig(newConfig);

        localStorage.setItem('myParts', JSON.stringify(newConfig.PartsList));

        return mintingConfig;
    }

    async function getAllPartsJson(project) {
        // extract avatar format from layers
        recurseOverParts(project, "PartsList");
    }

    function recurseOverParts(obj, parent) {
        for (let child of obj.children) {
            if (child.children != undefined) {
                recurseOverParts(child, parent + "." + child.name);
            } else {
                addToPartsList(parent + "." + child.name);
            }
        }
    }

    function addToPartsList(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        var partStringArray = partString.split(".");

        var partToAdd = {
            name: partStringArray[partStringArray.length - 1],
            weight: 10,

            // weight is used to detemine chance to get.
            //
            // chance to get is determined by sum of all weights in a partCategory
            // divided by a specific part's weight.
            //
            // For example, if there are 5 parts in a partCategory and each part has a weight of 10
            // then all parts have an equal chance of being selected.
            //
            // If one part has a weight of 20, and all others have a weight of 10,
            // then that part has twice the chance of being selected from all the others.
            //
            // All part weights start as 10 for the initial configuration,
            // meaning they can all be selected equally.
        };

        var partCategory = partString.slice(0, partString.lastIndexOf("."));

        // check if object should be added to array
        var currentPartSet = _.get(tempPartsList, partCategory);
        if (currentPartSet == undefined) {
            currentPartSet = [partToAdd];
        } else {
          if (Array.isArray(currentPartSet)) {
            currentPartSet.push(partToAdd);
          } else {
            console.warn(`Incorrect partString: ${partString}, not an array`)
          }
        }

        _.set(objectToAdd, partCategory, currentPartSet);

        tempPartsList = _.merge(tempPartsList, objectToAdd);
    }

    async function randomizeHiddenParts() {
        requiredPartsList = [];
        tempLootText = [];

        function traverse(jsonObj, parent, hideAll) {
            if (jsonObj !== null && typeof jsonObj == "object") {
                Object.entries(jsonObj).forEach(([key, value]) => {
                    // key is either an array index or object key
                    var parentTrace = parent === "" ? key : parent + "/" + key;

                    if (key != "Root") {
                        findPartFromProject(key).hidden = false;
                    }

                    traverse(value, parentTrace, hideAll);
                });
            } else {
                // if layer name includes OPTIONAL_%, do a randomization
                var optional_percent = 1.1;

                if (parent.includes("OPTIONAL")) {
                    var i = parent.lastIndexOf("OPTIONAL_") + "OPTIONAL_".length;
                    var j = parent.lastIndexOf("%") + 1;
                    optional_percent = parseFloat(parent.substring(i, j)) / 100.0;
                }

                if (Math.random() >= optional_percent) {
                    project.get_by_path(parent.split("Root/Root")[1] + "/" + jsonObj).hidden = true;
                } else {
                    randomizePart(parent + "//" + jsonObj, hideAll);
                }
            }
        }

        traverse(randomConfig, "Root", false);

        // Object.entries(randomConfig.Root).forEach(([key, value]) => {
        //     var path = "Root/" + key;
        //     var hideAll = true;

        //     if (key === baseClass) {
        //         hideAll = false;

        //     }

        //     if (!key.includes("IGNORE")) {
        //         traverse(value, path, hideAll);
        //         project.get_by_path("/" + key).hidden = (hideAll && !key.includes("UNIVERSAL"));
        //     }
        // });
    }

    var hold = [];
    function getAllItems(param) {
        for (let i = 0; i < param.length; i++) {
            if (param[i].children !== undefined && param[i].children.length !== 0) {
                getAllItems(param[i].children);
            }
            else {
                if (hold.indexOf(param[i].parent) === -1 && param[i].parent.name.includes("CLASS") === false) {
                    hold.push(param[i].parent);
                }

            }
        }
    }

    function getClassImageData(param) {
        //console.log(param);

        let obj = {};
        obj.class = [];
        obj.base = [];
        obj.background = [];
        for (let i = 0; i < param.children[0].children.length; i++) {
            if (param.children[0].children[i].name.includes("CLASS") === true) {
                obj.class.push(param.children[0].children[i]);
            }
            if (param.children[0].children[i].name.includes("base") === true) {
                obj.base.push(param.children[0].children[i]);
            }
        }
        for (let i = 0; i < param.children[1].children.length; i++) {
            if (param.children[1].children[i].name.includes("CLASS") === true) {
                obj.class.push(param.children[1].children[i]);
            }
            if (param.children[1].children[i].name.includes("base") === true) {
                obj.base.push(param.children[1].children[i]);
            }
        }
        for (let i = 0; i < param.children[2].children.length; i++) {
            obj.background.push(param.children[2].children[i]);
        }
        return obj;
    }

    const fillImageData = async () => {
        await loadProject();
        return getClassImageData(project);
    }

    function randomizePart(partString, hideAll) {
        // var currentPart = partString.split("//")[1];

        hold.length = 0;
        getAllItems(project.children);
        setHoldDataParts([...hold]);

        var currentPart = partString.split("//")[1];
        var path = partString.split("Root/Root")[1].split("//")[0];
        var partType = path.split("/")[1];

        // get node in open-raster project
        var layer = project.get_by_path(path);

        var index;

        const layer_base64 = project
            .get_by_path(path)
            .get_base64()
            .then(value => {
                index = project.get_by_path(path).z_index;
                if (project.get_by_path(path).name.includes("Background") ||
                    project.get_by_path(path).name.includes("background")) {
                    index = 0;
                }
                if (project.get_by_path(path).name.includes("Head") ||
                    project.get_by_path(path).name.includes("head")) {
                    index = 9;
                }
                if (project.get_by_path(path).name.includes("Bottom") ||
                    project.get_by_path(path).name.includes("bottom")) {
                    index = 10;
                }
                let currentObj = {
                    name: project.get_by_path(path).name,
                    value: value,
                    zIndex: index,
                    color: "Loading...",
                    key: project.get_by_path(path).name,
                    title: project.get_by_path(path).name,
                    type: "default"
                };
                dataParts.push(currentObj);
            });



        var totalOptions = layer.children.length;

        // randomize a number
        var randomPartIndex = Math.floor(Math.random() * totalOptions);

        // hide all parts
        for (var child of layer.children) {
            child.hidden = true;
        }

        // if a part is part of required list, unhide it and exit function
        for (var child of layer.children) {
            if (requiredPartsList.includes(child.name)) {
                child.hidden = false;
                return;
            }
        }

        // don't show a part if hideAll is true, unless layer is UNIVERSAL
        if (hideAll && !partString.includes("UNIVERSAL")) {
            return;
        }

        // unhide one part (with accessory check)
        if (randomPartIndex != layer.children.length) {
            // console.log( layer.children[randomPartIndex].name)
            layer.children[randomPartIndex].hidden = false;

            // check if the part requires other parts unhidden
            checkRequiredParts(layer.children[randomPartIndex].name);

            if (tempLootText.length < 5) {
                var modifier = "";
                var rarity = "Common";
                if (Math.random() < 0.3) {
                    rarity = "Rare";
                    modifier = "Shiny ";
                    if (Math.random() < 0.3) {
                        rarity = "Legendary";
                        modifier = "Mythical "
                    }

                }

                var lootObj = {
                    name: modifier + layer.children[randomPartIndex].name,
                    rarity
                }

                tempLootText.push(lootObj)
            }
        }
    }

    function checkRequiredParts(partString) {
        var splitStringArray = partString.split(" ");

        for (var i = 0; i < splitStringArray.length; i++) {
            if (splitStringArray[i] === "REQUIRES") {
                var requiredPart = splitStringArray[i + 1];

                // save required parts parent so they can be overridden
                requiredPartsList.push(requiredPart);

                i++;
            }
        }
    }

    function findPartFromProject(partName) {
        return recursivelyFindPart(project, "Root", partName);
    }

    function recursivelyFindPart(obj, parent, partName) {
        var node = undefined;

        for (let child of obj.children) {
            if (child.name === partName) {
                return child;
            }

            if (child.children != undefined) {
                node = recursivelyFindPart(child, parent + "." + child.name, partName);

                if (node != undefined) {
                    return node;
                }
            } else {
                if (child.name === partName) {
                    return child;
                }
            }
        }
    }

    async function getAvatarConfiguration(project, forcedClass) {
        recurseOverChildren(project, "Root", forcedClass);
        setConfigTree(currentTreeConfig);
    }

    function getRandomClasses() {
        var returnArray = []

        if (classOptions.length > 0) {
            var index = Math.floor(Math.random() * classOptions.length);
            var selectedClass = classOptions[index];
            returnArray.push(selectedClass.value);

            while (selectedClass.children != null) {
                index = Math.floor(Math.random() * selectedClass.children.length);
                returnArray.push(selectedClass.children[index].value);
                selectedClass = selectedClass.children[index];
            }

        }

        return returnArray;
    }

    function refreshClassOptions(classArray) {
        var returnArray = [];
        for (var i = 0; i < classArray.length; i++) {
            returnArray.push(
                {
                    value: classArray[i].name,
                    label: classArray[i].name,
                    children: refreshClassOptionsRecursively(classArray[i].children)
                })
        }

        setClassOptions(returnArray);
    }

    function refreshClassOptionsRecursively(childArray) {
        var returnArray = []

        for (var i = 0; i < childArray.length; i++) {
            returnArray.push(
                {
                    value: childArray[i].name,
                    label: childArray[i].name,
                    children: refreshClassOptionsRecursively(childArray[i].children)
                })
        }

        if (returnArray.length == 0) return null

        return returnArray;
    }

    function recurseOverChildren(obj, parent, forcedClass) {
        for (let child of obj.children) {
            if (child.name === "IGNORE") {
                continue;
            }

            if (forcedClass != null) {
                if (child.name.includes("CLASS") && !forcedClass.includes(child.name)) {
                    continue;
                }
            }

            else if (child.name.includes("CLASS") && !selectedClass.includes(child.name)) {
                continue;
            }

            if (child.children != undefined) {
                recurseOverChildren(child, parent + "." + child.name, forcedClass);
            } else {
                addToConfig(parent + "." + child.name);
                addToTreeConfig(parent + "." + child.name);
            }
        }
    }

    function addToConfig(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        currentRandomConfig = _.merge(currentRandomConfig, objectToAdd);
    }

    function addToTreeConfig(partString) {
        var nodeArray = partString.split(".").reverse();
        nodeArray.pop();

        var objectToAdd = recursivelyCreateTreeNode([...nodeArray]);
        addObjectToTree(objectToAdd);
    }

    function recursivelyCreateTreeNode(nodeArray) {
        if (nodeArray.length <= 1) {
            return {
                key: nodeArray[0],
                title: nodeArray[0]
            }
        } else {
            var node = {};
            var nodeName = nodeArray.pop();
            node.key = nodeName;
            node.title = nodeName;
            node.children = [];
            node.children.push(recursivelyCreateTreeNode(nodeArray));
            return node;
        }
    }

    function addObjectToTree(objectToAdd) {
        // console.log(objectToAdd);
        // console.log(JSON.stringify(currentTreeConfig));
        var childArray = currentTreeConfig;
        var nodeToAdd = objectToAdd;
        var selectedNode = null;
        var finished = false;

        while (!finished) {
            selectedNode = null;
            var nodeName = nodeToAdd.key;
            // console.log(nodeName);

            // check if node already exists
            for (const node of childArray) {

                // console.log(node.key);

                if (node.key === nodeName) {
                    selectedNode = node;
                    break;
                }
            }

            // console.log(selectedNode);

            // if node was not found, create a new one
            if (selectedNode == null) {
                // console.log(childArray);
                var node = {};
                node.key = nodeName;
                node.title = nodeName;
                node.children = [];
                childArray.push(node);
                childArray = node.children;
            }

            // if node was found
            else {
                childArray = selectedNode.children;
            }

            if (nodeToAdd.children === undefined) {
                finished = true;

            }
            else {
                nodeToAdd = nodeToAdd.children[0];
            }
        }
    }

    function recursivelyCreateNodes(partArray) {
        if (partArray.length <= 1) {
            return partArray[0];
        } else {
            var node = {};
            var nodeName = partArray.pop();
            node[nodeName] = recursivelyCreateNodes(partArray);
            return node;
        }
    }

    async function renderAvatar() {
        return await rend.make_merged_image(); // returns canvas
    }

    return [
        canvasRef,
        dataParts,
        loadProject,
        fillImageData,
        reloadConfig,
        getAvatar,
        infoDataParts,
        setInfoDataParts,
        holdDataParts,
        setHoldDataParts,
        project,
        changeAvatarColor,
        finalRender,
        canvasWidth,
        canvasHeight,
        setNewAvatar,
        getMintingConfig,
        generateMetadataJson,
        oldGenerateMetadataJson,
        setMintingConfig,
        metadataJson,
        uploadedTokenURI,
        startIPFSUpload,
        ipfsHash,
        classOptions,
        setSelectedClass,
        selectedClass,
        configTree,
        setConfigTree,
        lootText
    ];
};

export default useAvatar;
