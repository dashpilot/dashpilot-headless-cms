config = {}
config.imgPath = 'https://raw.githubusercontent.com/dashpilot/test-repo/main/';

const getData = async function(service, path) {
  let opts = {};
  opts.path = path;
  call_api(service + '/get-data', opts).then(function(res) {
    return res;
  });
}

function logout() {

}

async function call_api(route, mydata) {

  var settings = {
    method: 'post',
    body: JSON.stringify(mydata),
  };
  try {
    const fetchResponse = await fetch(route, settings);
    const result = await fetchResponse.json();
    return result;
  } catch (e) {
    return e;
  }

}