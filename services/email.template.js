// const { config } = require("../config/environment");
require("dotenv").config();
const config = process.env;
exports.template = (options) => {
  return `<body topmargin="0" rightmargin="0" bottommargin="0" leftmargin="0" marginwidth="0" marginheight="0" width="100%" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%; height: 100%; -webkit-font-smoothing: antialiased; text-size-adjust: 100%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 100%;
        background-color: #F0F0F0;
        color: #000000;" bgcolor="#F0F0F0" text="#000000">
    
        <style>
            /* Reset styles */
            body {
                margin: 0;
                padding: 0;
                min-width: 100%;
                width: 100% !important;
                height: 100% !important;
            }
    
            body,
            table,
            td,
            div,
            p,
            a {
                -webkit-font-smoothing: antialiased;
                text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
                line-height: 100%;
            }
    
            table,
            td {
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                border-collapse: collapse !important;
                border-spacing: 0;
            }
    
            img {
                border: 0;
                line-height: 100%;
                outline: none;
                text-decoration: none;
                -ms-interpolation-mode: bicubic;
            }
    
            #outlook a {
                padding: 0;
            }
    
            .ReadMsgBody {
                width: 100%;
            }
    
            .ExternalClass {
                width: 100%;
            }
    
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
                line-height: 100%;
            }
    
            /* Rounded corners for advanced mail clients only */
            @media all and (min-width: 560px) {
                .container {
                    border-radius: 8px;
                    -webkit-border-radius: 8px;
                    -moz-border-radius: 8px;
                    -khtml-border-radius: 8px;
                }
            }
    
            /* Set color for auto links (addresses, dates, etc.) */
            a,
            a:hover {
                color: #127DB3;
            }
    
            .footer a,
            .footer a:hover {
                color: #999999;
            }
    
        </style>
        <!-- SECTION / BACKGROUND -->
        <!-- Set message background color one again -->
        <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0"
            style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%;" class="background">
            <tr>
                <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0;"
                    bgcolor="#F0F0F0">
    
    
                    <!-- WRAPPER / CONTEINER -->
                    <!-- Set conteiner background color -->
                    <table border="0" cellpadding="0" cellspacing="0" align="center" bgcolor="#FFFFFF" width="560" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit;
        max-width: 560px;" class="container">
    
                        <!-- HEADER -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif") -->
                            <tr>
                            <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 24px; font-weight: bold; line-height: 130%;
                            padding-top: 25px;
                            color: #000000;
                            font-family: sans-serif;" class="header">
                            <img src="https://${
                              config.URL
                            }/asset/logo/logo.png" alt="${
    config.APP_NAME
  }" width="200" />
                            </td>
                        </tr>
    
                        <!-- SUBHEADER -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif") -->
                        
    
                        <!-- PARAGRAPH -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif"). Duplicate all text styles in links, including line-height -->
                        <tr>
                            <td align="left" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
                padding-top: 25px; 
                color: #000000;
                font-family: sans-serif;" class="paragraph">
                                ${options.message || options.message_1}
                            </td>
                        </tr>

                        <!-- PARAGRAPH -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif"). Duplicate all text styles in links, including line-height -->
                        <tr>
                            <td align="left" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
                padding-top: 25px; 
                color: #000000;
                font-family: sans-serif;" class="paragraph">
                                ${options.message_2 || ""}
                            </td>
                        </tr>

                        <!-- PARAGRAPH -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif"). Duplicate all text styles in links, including line-height -->
                        <tr>
                            <td align="left" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
                padding-top: 25px; 
                color: #000000;
                font-family: sans-serif;" class="paragraph">
                                ${options.message_3 || ""}
                            </td>
                        </tr>
    
                        <!-- BUTTON -->
                        <!-- Set button background color at TD, link/text color at A and TD, font family ("sans-serif" or "Georgia, serif") at TD. For verification codes add "letter-spacing: 5px;". Link format: http://domain.com/?utm_source={{Campaign-Source}}&utm_medium=email&utm_content={{Button-Name}}&utm_campaign={{Campaign-Name}} -->
                        <tr>
                            <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%;
                padding-top: 25px;
                padding-bottom: 5px;" class="button"><a href="#" target="_blank"
                                    style="text-decoration: none;">
                                    <table border="0" cellpadding="0" cellspacing="0" align="center"
                                        style="max-width: 240px; min-width: 120px; border-collapse: collapse; border-spacing: 0; padding: 0;">
                                        <tr>
                                            <td align="center" valign="middle"
                                                style="padding: 12px 24px; margin: 0; text-decoration: none; border-collapse: collapse; border-spacing: 0; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; -khtml-border-radius: 4px;"
                                                bgcolor="#40196d"><a target="_blank" style="text-decoration: none;
                        color: #FFFFFF; font-family: sans-serif; font-size: 17px; font-weight: 400; line-height: 120%;"
                                                    href="${options.ctaLink}">
                                                    ${options.cta}
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </a>
                            </td>
                        </tr>
    
                        
                        <!-- LINE -->
                        <!-- Set line color -->
                        <tr>
                            <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%;
                padding-top: 25px;" class="line">
                                <hr color="#E0E0E0" align="center" width="100%" size="1" noshade
                                    style="margin: 0; padding: 0;" />
                            </td>
                        </tr>
    
                        <!-- PARAGRAPH -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif"). Duplicate all text styles in links, including line-height -->
                        <tr>
                            <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 17px; font-weight: 400; line-height: 160%;
                padding-top: 20px;
                padding-bottom: 25px;
                color: #000000;
                font-family: sans-serif;" class="paragraph">
                                Have a&nbsp;question? <a href="mailto:${
                                  config.SUPPORT_MAIL
                                }" target="_blank"
                                    style="color: #127DB3; font-family: sans-serif; font-size: 17px; font-weight: 400; line-height: 160%;">${
                                      config.SUPPORT_MAIL
                                    }</a>
                            </td>
                        </tr>
    
                        <!-- End of WRAPPER -->
                    </table>
    
                    <!-- WRAPPER -->
                    <!-- Set wrapper width (twice) -->
                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="560" style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit;
        max-width: 560px;" class="wrapper">
    
                        <!-- FOOTER -->
                        <!-- Set text color and font family ("sans-serif" or "Georgia, serif"). Duplicate all text styles in links, including line-height -->
                        <tr>
                            <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; padding-left: 6.25%; padding-right: 6.25%; width: 87.5%; font-size: 13px; font-weight: 400; line-height: 150%;
                padding-top: 20px;
                padding-bottom: 20px;
                color: #999999;
                font-family: sans-serif;" class="footer">
    
                                This email was sent to&nbsp;you because you&nbsp;have an account&nbsp;with&nbsp;us. If&nbsp;that is incorrect <p
                                    style="text-decoration: underline; color: #999999; font-family: sans-serif; font-size: 13px; font-weight: 400; line-height: 150%;">kindly
                                    disregard this email.</p>
    
                            </td>
                        </tr>
    
                        <!-- End of WRAPPER -->
                    </table>
    
                    <!-- End of SECTION / BACKGROUND -->
                </td>
            </tr>
        </table>
    
    </body>
    `;
};
