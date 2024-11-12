import { mailtrapClient, sender} from "./mailtrap.config.js"
import { VERIFICATION_EMAIL_TEMPLATE , PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE} from "./emailTemplates.js"


export const sendVerificationEmail = async (email, verificationToken) =>{
    const recipient = [{email}]

    try {
        const response = await mailtrapClient.send({
            from:sender,
            to: recipient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification"
        })

        console.log("Email sent successfully", response);
    } catch (error) {
        console.error(`Error sending verification email`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
}

export const sendWelcomeEmail = async (email,name) => {
    const recipient = [{ email }];
    try {
        
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            template_uuid: "61455ae6-f34e-46ce-86be-d5bc05d26927",
            template_variables: {
                company_info_name: "Nutrition Tracker",
                name: name,
            },
        });

        console.log("Welcome email sent successfully", response);
    } catch (error) {
        console.error(`Error sending welcome email`, error);

        throw new Error(`Error sending welcome email: ${error}`);
    }
}

export const sendForgotPasswordEmail = async (email, resetURL) => {
    const recipient = [{email}]
    try {
        const response = await mailtrapClient.send({
            from:sender,
            to: recipient,
            subject: "Reset Password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Reset Password"
        })

        console.log("Email sent successfully", response);
    } catch (error) {
        console.error(`Error sending reset password email`, error);
        throw new Error(`Error sending reset password email: ${error}`);
    }
}

export const sendResetSuccessEmail = async (email) => {
    const recipient = [{ email }]

    try {
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Reset password successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset"
        })
        console.log("Password reset email sent successfully", response);
    } catch (error) {
        console.log(`Error sending password reset success email`, error);
        throw new Error(`Error sending password reset success email: ${error}`);
        
        
    }
}