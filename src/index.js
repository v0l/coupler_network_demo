import axios from "axios";

const timer = ms => new Promise(res => setTimeout(res, ms));

const BaseUri = "https://api.coupler.network/";

// Here you can put receive/read token if you only want to allow receiving funds to your account
const ApiToken = "my_token"; // todo: change this

const Api = axios.create({
    baseURL: BaseUri,
    headers: {
        "X-Auth-Token": ApiToken,
        "Accept": "application/json"
    }
});

async function GetUser() {
    let rsp = await Api.get("/v0/user");
    return rsp.data.user;
}

async function CreateInvoice(amount, memo, expiry = 3600) {
    let rsp = await Api.post("/v0/invoices", {
        memo,
        amount_msats: amount,
        expiry_secs: expiry
    });
    return rsp.data.invoice;
}

async function GetInvoice(id) {
    let rsp = await Api.get(`/v0/invoices/${id}`);
    return rsp.data.invoice;
}

let user = await GetUser();
console.log(`Logged in as ${user.email}`);
console.log(`Balance: ${user.balance_msats.toLocaleString()} msats`);

let invoice = await CreateInvoice(100_000, "demo app");

// Store invoice.id mapping to user subscription table
console.log(`Please pay: ${invoice.invoice}`);

let exp = new Date(invoice.expires_at);
while (true) {
    let status = await GetInvoice(invoice.id);
    if (status.is_settled) {
        console.log("Invoice paid, thanks!");
        user = await GetUser();
        console.log(`New Balance: ${user.balance_msats.toLocaleString()} msats`);
        break;
    }

    if (exp.getTime() < new Date().getTime() || status.is_expired) {
        console.warn("Invoice is expired");
        break;
    }
    
    await timer(5_000);
}
