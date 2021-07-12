import * as cors from 'cors';
import * as express from 'express';

import { JSOra } from './lib/jsora';
import * as _ from './lib/lodash.min.js';

import { join } from 'path';

const fs = require("fs");
const pth = require("path");

const PORT = Number(process.env.PORT || 3001);

const app = express();

app.use(cors());
app.use(express.json());

var config = { "Root": {} }
var project = new JSOra();

let data = fs.readFileSync(pth.join(__dirname,"img/avatarimages.ora"));

// project.load(data);

// let loaded_file = await fetch(`img/AvatarImages.ora`).then(r => r.blob());
// await project.load(loaded_file);

// Serve static resources from the "public" folder
app.use(express.static(join(__dirname, 'public')));

// ROUTES
app.get('/avatar/new', async (req: any, res: any) => {
  res.json(
      {
        hello: "world"
      }
  )
})

console.log(project);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
})
