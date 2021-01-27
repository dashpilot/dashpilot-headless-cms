import Status from 'http-status-codes';
import verifyToken from "../auth/firebase.js";
import {
  deleteFile
} from "./lib/github.js";

export default async (req, res) => {

  if (!process.env.GH_TOKEN) {
    return res.status(Status.BAD_REQUEST).send('Environment variable not set');
  } else if (req.method !== 'POST') {
    return res.status(Status.BAD_REQUEST).send('Only POST method is allowed');
  } else {

    const token = req.headers.authorization;
    const path = req.body.path;


    verifyToken(token).then(function(userid) {

      deleteFile(path).then(function(result) {
        res.json({
          ok: result.ok,
          msg: "File has been deleted"
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