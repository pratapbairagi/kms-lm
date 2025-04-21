import React from 'react';

const HtmlTemplate = ({ senderData, mailData, row }) => {
    console.log("row ", row)
    console.log("senderData ", senderData)
    console.log("mailData ", mailData)
    const htmlContent = `
 < !DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Confirmation</title>
                    <style>
                    *{
                    margin: 0;
                    padding : 0 ;
                    }
                    </style>
                </head>
                <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">

                    <table role="presentation" style="width: 100%; background-color: #f4f4f4; ">
                        <tr>
                            <td>
                                <table role="presentation" style="width: 600px; background-color: #ffffff; margin: 0 auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                                    <tr>
                                        <td style="text-align: center; padding-bottom: 20px;">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="brown" class="bi bi-award-fill" viewBox="0 0 16 16">
                                                <path d="m8 0 1.669.864 1.858.282.842 1.68 1.337 1.32L13.4 6l.306 1.854-1.337 1.32-.842 1.68-1.858.282L8 12l-1.669-.864-1.858-.282-.842-1.68-1.337-1.32L2.6 6l-.306-1.854 1.337-1.32.842-1.68L6.331.864z" />
                                                <path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1z" />
                                            </svg>
                                            <h2 style=" color: brown;  margin: 0; margin-top: 8px;">CHITTARANJAN PARK KALI MANDIR SOCIETY</h2>
                                            <h5 style="color: brown;  margin: 0; margin-top: 6px;">(REGD.)</h5>
                                            <p style="color: brown; font-size: 12px; display: flex; justify-content: space-between; text-transform: uppercase;"> 

                                            <table role="presentation" style="width: 100%; table-layout: fixed; margin-top: 7px;">
                <tr style="border-bottom:1px solid #555555; margin-bottom: 20px;">
                    <td style="width: 33%; font-weight: bold; text-align: center; color: #555555;"> PRESIDENT - P.K. DAS </td>
                    <td style="width: 33%; font-weight: bold; text-align: center; color: #555555;"> SECRETARY - DR. RAJIV NAG </td>
                    <td style="width: 33%; font-weight: bold; text-align: center; color: #555555;"> TREASURER - MIHIR NAG </td>
                </tr >
                </table>
                <hr/>

                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 16px; line-height: 1.6; color: #555555; padding-bottom: 20px;">
                                            <p style="align-items:center; display: flex; justify-content: space-between;"> 

                                            <table role="presentation" style="width: 100%; table-layout: fixed;">
                <tr>
                    <td style="width: 67%; text-align: left; text-transform: capitalize; font-weight: bold; color: #555555;"> Dear ${row?.NAME.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}, </td>
                    <td style="width: 33%; text-align: right; white-space: no-wrap; font-weight: bold; color: #555555;"> Date : ${senderData?.date || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }).split(",")[0]} </td>
                </tr>
            </table>

                                            </p>
                                            <p style="text-align: justify;">${mailData.message}</p>
                                            
                                            <p>Thanking You,</p>
                                            <p style="margin-top:4px;">Yours Faithfully,</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 16px; line-height: 1.6; color: #555555; padding-bottom: 20px; margin-top: 80px;">
                                            <div>
                                            <strong style="display:block; width: 100%;">( ${mailData.from} )</strong>
                                             <p style="margin-left:20px; display:block; width: 100%; margin-top: 8px;">Secretary</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr style="border-top:1px solid gray; padding-top: 20px; border-top:1px solid gray;">
                                        <td style="font-size: 12px; color: #aaaaaa; text-align: center; padding-top: 10px;">
                                            <p>East Bengal Displaced Persons' Association | Contact Info | Address Line 1</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                </body>
            </html> `

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default HtmlTemplate;
