import Status from 'http-status-codes';
import verifyToken from "../auth/firebase.js";
import {
  setData
} from "./lib/github.js";

export default async (req, res) => {

  if (!process.env.GH_TOKEN) {
    return res.status(Status.BAD_REQUEST).send('Environment variable not set');
  } else if (req.method !== 'POST') {
    return res.status(Status.BAD_REQUEST).send('Only POST method is allowed');
  } else {

    const token = req.headers.authorization;
    const path = req.body.path;
    var content = req.body.content;
    const type = req.body.type;

    if (type == 'json') {
      content = JSON.stringify(content)
    }

    verifyToken(token).then(function(userid) {

      setData(path, content, type).then(function(result) {
        res.json({
          ok: result.ok,
          msg: "Data saved to Github"
        })
      });

    }).catch(function(error) {
      console.error(error);
      res.json({
        ok: false,
        msg: 'Invalid token'
      })
    });

  }

}