import { useRef, useEffect, useState } from "react";

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
const all = require('it-all')

const useAvatar = (props) => {

    // load jsora and lodash
    const jsora = window.jsora;
    const _ = window._;
    const project = new jsora.JSOra();
    var rend;

    const [baseClassArray, setBaseClassArray] = useState([]);
    const [randomConfig, setRandomConfig] = useState({ "Root": {} });
    const [mintingConfig, setMintingConfig] = useState(
        {
            "amountToCreate": 2,
            "description": "An avatar for the open metaverse!",
            "external_url": "https://kernel.community/en/track-gaming/module-1",
            "initialized": false
        }
    )
    const [partsList, setPartsList] = useState({ "PartsList": {} });

    const [metadataJson, setMetadataJson] = useState({ "tokenMetadata": {} });
    
    const [uploadedTokenURI, setUploadedTokenURI] = useState({"tokenURI": {}});
    
    const [ipfsHash, setIpfsHash] = useState();

    const canvasRef = useRef(null);

    var tempPartsList = { "PartsList": {} }

    useEffect(() => {
        getAvatar();
    }, [props]);

    const loadProject = async () => {
        let loaded_file = await fetch(`avatars/AvatarImages.ora`).then(r => r.blob());
        await project.load(loaded_file);

    }

    async function drawAvatarFromMetadata(metadata, index, amountToCreate) {

        setRandomConfig({ "Root": {} });

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
                recurseOverMetadata(child, fullName, metadata)
            } else {
                // unhide layers specified in metadata
                if (_.get(metadata,parent) == child.name) {
                    child.hidden = false;
                }
                else {
                    child.hidden = true;
                }
            }
        }
    }


    const startIPFSUpload = async () => {

        await loadProject();
        rend = new jsora.Renderer(project);

        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                
        var tokenMetadata = metadataJson.tokenMetadata;

        var files = []
        var tokenURIArray = []

        const IMAGE_BASE_URI = "https://ipfs.io/ipfs/";
        const NAME_BASE = "Avatar "

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
                attributes: attrib
            }

            tokenURIArray.push(tokenURI);

            var tempTokenURI = {
                "tokenURI": tokenURIArray
            }

            setUploadedTokenURI(tempTokenURI);
            
            files.push(
                {
                    path: "/tmp/" + (i + 1),
                    content: JSON.stringify(tokenURI)
                }
            )

        } 
         
          const cid = (await all(ipfs.addAll(files))).pop().cid.string;

          setIpfsHash(cid);
    }

    const getAvatar = async () => {
            
        setRandomConfig({ "Root": {} });

        await loadProject();

        rend = new jsora.Renderer(project);

        // first time to retrieve default config from project 
        await getAvatarConfiguration(project);

        await randomizeHiddenParts();

        // // second time to retrieve new random parts
        await getAvatarConfiguration(project);

        await drawAvatar();
        
    };

    async function drawAvatar() {
        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext('2d');
        var newCanvas = await renderAvatar();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(newCanvas, 0, 0);

    }

    async function setNewAvatar() {
        await getAvatar();
        return randomConfig;
    }

    function toBlobWrapper(canvas) {
        return new Promise( (resolve, reject) => {
            canvas.toBlob( async (blob) => {
                var result = await ipfs.add(blob);
                resolve(result);
            }, (errorResponse) => {
                reject(errorResponse)
            }
        )})
    }

    async function drawMiniAvatar(i, amountToCreate, uploadToIPFS) {
        const canvasObj = canvasRef.current;
        const ctx = canvasObj.getContext('2d');
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
            };
        }

        else {
           ctx.drawImage(newCanvas, 0, 0, canvasWidth, canvasHeight, 
                     dx, dy, width, height);

            return null;
        }
    }


    async function getNewAvatarMetadata() {
        setRandomConfig({ "Root": {} });
        await randomizeHiddenParts();
        await getAvatarConfiguration(project);
    }

    async function generateMetadataJson(mintingConfigJSON) {
        if (mintingConfigJSON.initialized)
        {
            var amountToCreate = mintingConfigJSON.amountToCreate;
            var mintArray = [];

            await loadProject();
            await getAvatarConfiguration(project);
            rend = new jsora.Renderer(project);

            const canvasObj = canvasRef.current;
            const ctx = canvasObj.getContext('2d');
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
            for (var i = 1; i <= amountToCreate; i++)
            {
                await getNewAvatarMetadata();
                mintArray.push(JSON.parse(JSON.stringify(randomConfig)));
                await drawMiniAvatar(i, amountToCreate, false);

                var tempMetadataJson = {
                    "tokenMetadata": mintArray
                }
    
                setMetadataJson(tempMetadataJson);
            }

            // console.log(mintArray);

            return tempMetadataJson;

        }
        else {
            return {
                "filename": "metadata.json"                
            }
        }
    }

    async function getMintingConfig() {
        await loadProject();

        await getAllPartsJson(project);

        var newConfig = _.merge(mintingConfig, tempPartsList);
        newConfig.initialized = true;

        setPartsList(tempPartsList);
        setMintingConfig(newConfig);
        return mintingConfig;
    }

    async function getAllPartsJson(project) {
           // extract avatar format from layers
           recurseOverParts(project, "PartsList");
    }

    function recurseOverParts(obj, parent) {
        for (let child of obj.children) {

            if (child.children != undefined) {
                recurseOverParts(child, parent + "." + child.name)
            } else {
                    addToPartsList(parent + "." + child.name);
            }
        }
    }

    function addToPartsList(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        var partStringArray = partString.split(".");

        var partToAdd = { 
            "name": partStringArray[partStringArray.length - 1],
            "weight": 10 
            
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
        }

        var partCategory = partString.slice(0, partString.lastIndexOf("."));

        // check if object should be added to array
        var currentPartSet =_.get(tempPartsList, partCategory);
        if (currentPartSet == undefined) {
            currentPartSet = [partToAdd]
        }
        else {
            currentPartSet.push(partToAdd)
        }

        _.set(objectToAdd, partCategory, currentPartSet);

        tempPartsList = _.merge(tempPartsList, objectToAdd);
    }
    
    async function randomizeHiddenParts() {

        function traverse(jsonObj, parent, hideAll) {
            if (jsonObj !== null && typeof jsonObj == "object") {
                Object.entries(jsonObj).forEach(([key, value]) => {
                    // key is either an array index or object key
                    var parentTrace = parent === "" ? key : parent + "/" + key
                    traverse(value, parentTrace, hideAll);
                });
            }
            else {
                randomizePart(parent + "//" + jsonObj, hideAll)
            }
        }

        var baseClass = baseClassArray[Math.floor(Math.random()*baseClassArray.length)];

        Object.entries(randomConfig.Root).forEach(([key, value]) => {
            var path = "Root/" + key;
            var hideAll = true;

            if (key === baseClass) {
                hideAll = false;
                
            }

            if (!key.includes("IGNORE")) {
                traverse(value, path, hideAll);
                project.get_by_path("/" + key).hidden = (hideAll && !key.includes("UNIVERSAL"));
            }
        });

    }

    // TODO: We assume some layer properties and layer depth here.
    // we should remove these assumptions and encode part properties on layer name (is it nullable, etc)
    function randomizePart(partString, hideAll) {

        // var currentPart = partString.split("//")[1];
        var path = "/" + partString.split("Root/")[1].split("//")[0];
        var partType = path.split("/")[1];

        // get node in open-raster project
        var layer = project.get_by_path(path);

        // disable accessories check
        // // accessories are optional
        // var isAccessory = partType === "Accessories";

        // // if accessory, last option means no accessory is chosen
        // var totalOptions = isAccessory ? layer.children.length + 1 : layer.children.length

        var totalOptions = layer.children.length;

        // randomize a number
        var randomPartIndex = Math.floor(Math.random() * totalOptions);

        // hide all parts
        for (var child of layer.children) {
            child.hidden = true;
        }

        if (hideAll && !partString.includes("UNIVERSAL")) {
            return;
        }

        // unhide one part (with accessory check)
        if (randomPartIndex != layer.children.length) {

            // console.log( layer.children[randomPartIndex].name)

            layer.children[randomPartIndex].hidden = false;
        }
    }    

    async function getAvatarConfiguration(project) {

        // get base classes
        getBaseClasses(project);

        // extract avatar format from layers
        recurseOverChildren(project, "Root");

    }

    function getBaseClasses(obj) {
        var tempBaseClassArray = [];
        for (let child of obj.children) {
            if (!child.name.includes("IGNORE") && !child.name.includes("UNIVERSAL")) {
                tempBaseClassArray.push(child.name);
            }
        }
        setBaseClassArray(tempBaseClassArray);
    }

    function recurseOverChildren(obj, parent) {
        for (let child of obj.children) {
            if (child.name === "IGNORE") {
                continue;
            }

            if (child.children != undefined) {
                recurseOverChildren(child, parent + "." + child.name)
            } else {
                if (!child.hidden) {
                    addToConfig(parent + "." + child.name);
                }
            }
        }
    }

    function addToConfig(partString) {
        var objectToAdd = recursivelyCreateNodes(partString.split(".").reverse());
        setRandomConfig(_.merge(randomConfig, objectToAdd));
    }

    function recursivelyCreateNodes(partArray) {
        if (partArray.length <= 1) {
            return partArray[0];
        }
        else {
            var node = {};
            var nodeName = partArray.pop();
            node[nodeName] = recursivelyCreateNodes(partArray);
            return node;
        }
    }



    async function renderAvatar() {

        return await rend.make_merged_image(); // returns canvas

    }

    return [canvasRef, canvasWidth, canvasHeight, 
        setNewAvatar, getMintingConfig, generateMetadataJson, 
        setMintingConfig, metadataJson, uploadedTokenURI, startIPFSUpload, ipfsHash]
};

export default useAvatar;
