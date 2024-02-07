import dotenv from 'dotenv'
import { Command } from 'commander'

dotenv.config()

const commandLineOptions = new Command()

commandLineOptions.option('--port <port>').option('--mode <mode>').parse()

//console.log(commandLineOptions.opts())
//console.log(process.env.MONGOOSE_URL)

const config = {
    PORT: commandLineOptions.opts().port || 8080,
    MONGOOSE_URL: process.env.MONGOOSE_URL,
    SIGNEDCOOKIECODE: process.env.SIGNEDCOOKIECODE,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    MONGOOSE_STORE_SECRET: process.env.MONGOOSE_STORE_SECRET
}

export default config