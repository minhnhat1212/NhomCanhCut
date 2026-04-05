const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "129ab938f8761e",
        pass: "76cc612fafec55",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        // Uncomment the code below when you have valid mailtrap credentials
        /*
        await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass",
            html: "click vao <a href=" + url+ ">day</a> de doi pass",
        })
        */
        console.log("=== MOCK EMAIL SENT ===");
        console.log("To:", to);
        console.log("Reset Link:", url);
        console.log("=======================");
        return true;
    }
}

// Send an email using async/await
