const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs')
const Mux = require('@mux/mux-node');


dotenv.config();

app.use(cors());
app.use(bodyParser.json());

const { Video } = new Mux(
    process.env.MUX_TOKEN_SECRET,
    process.env.MUX_TOKEN_ID
);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: process.env.EMAIL_SMTP_PORT,
    auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS
    }
});

app.post('/create-event', (req, res) => {
    const { attendees, eventName, user, slug } = req.body;

    const emailTemplatePath = path.join(__dirname, 'email-template.html');
    const emailTemplate = fs.readFileSync(emailTemplatePath, 'utf-8');

    Video.Spaces.create()
        .then((spaceResponse) => {
            const spaceID = spaceResponse.id;

            Video.LiveStreams.create({
                playback_policy: 'public',
                new_asset_settings: { playback_policy: 'public' },
            })
                .then((streamResponse) => {
                    const streamID = streamResponse.id;

                    Video.Spaces.Broadcasts.create(spaceID, {
                        live_stream_id: streamID,
                    })
                        .then((broadcastResponse) => {
                            const spaceToken = Mux.JWT.signSpaceId(spaceID);
                            console.log(spaceToken);

                            attendees.forEach(function (to) {
                                const customizedEmailTemplate = emailTemplate
                                    .replace('{user}', user)
                                    .replace('{eventName}', eventName)
                                    .replace('{host}', to.name)
                                    .replace('{token}', process.env.HOME_URL + '/events/' + slug + '/' + to.token)

                                const mailOptions = {
                                    from: process.env.EMAIL_ADDRESS_FROM,
                                    to: to.email,
                                    subject: 'Email Invitation',
                                    html: customizedEmailTemplate
                                };

                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.error('Error sending email:', error);
                                    } else {
                                        console.log('Email sent:', info.response);
                                        res.status(200).json({ success: true });
                                    }
                                });
                            })


                            res.status(200).json({ token: spaceToken });
                        })
                        .catch((error) => {
                            console.error('Failed to create broadcast:', error);
                            res.status(500).json({ error: 'Failed to create broadcast' });
                        });
                })
                .catch((error) => {
                    console.error('Failed to create livestream:', error);
                    res.status(500).json({ error: 'Failed to create livestream' });
                });
        })
        .catch((error) => {
            console.error('Failed to create space:', error);
            res.status(500).json({ error: 'Failed to create space' });
        });
});

app.listen(3001, () => {
    console.log('Server is running');
});
