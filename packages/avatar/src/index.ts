import * as cors from 'cors';
import * as express from 'express';

import { join } from 'path';


const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
})
