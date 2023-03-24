const { fetch } = require("undici")
module.exports = async function scQuery(scAddress, query) {

    let response = await fetch(`https://${scAddress}.${config.exmEndpoint}?ignoreState=true`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(query) }).then(r => r.json())
    return response

}