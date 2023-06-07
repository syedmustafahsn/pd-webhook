const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const Mux = require('@mux/mux-node');

dotenv.config();

app.use(cors());
app.use(bodyParser.json());

const { Video } = new Mux(
    '597f62db-fd53-4eda-8a78-76a50172f379',
    'UanvuFMUMWTR5KSm2FaR3lQxsJaIzI9FPfYk8eBfLOHtIoAsNAF0L1v6CXzdKAi8MkFzgBMNibP'
);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: process.env.EMAIL_SMTP_PORT,
    auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS
    },
});

app.post('/create-event', (req, res) => {

    transporter.sendMail({
        from: process.env.EMAIL_ADDRESS_FROM,
        to: req.body.email,
        subject: 'Test Email',
        text: 'This is a test email sent using Nodemailer.',
    }, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    })

    // Video.Spaces.create()
    //     .then((spaceResponse) => {
    //         const spaceID = spaceResponse.id;

    //         Video.LiveStreams.create({
    //             playback_policy: 'public',
    //             new_asset_settings: { playback_policy: 'public' },
    //         })
    //             .then((streamResponse) => {
    //                 const streamID = streamResponse.id;

    //                 Video.Spaces.Broadcasts.create(spaceID, {
    //                     live_stream_id: streamID,
    //                 })
    //                     .then((broadcastResponse) => {
    //                         const spaceToken = Mux.JWT.signSpaceId(spaceID);
    //                         console.log(spaceToken);

    //                         res.status(200).json({ spaceToken });
    //                     })
    //                     .catch((error) => {
    //                         console.error('Failed to create broadcast:', error);
    //                         res.status(500).json({ error: 'Failed to create broadcast' });
    //                     });
    //             })
    //             .catch((error) => {
    //                 console.error('Failed to create livestream:', error);
    //                 res.status(500).json({ error: 'Failed to create livestream' });
    //             });
    //     })
    //     .catch((error) => {
    //         console.error('Failed to create space:', error);
    //         res.status(500).json({ error: 'Failed to create space' });
    //     });
});


app.listen(3001, () => {
    console.log('SERVER IS RUNNING');
});
