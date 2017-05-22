/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Moderates messages by lowering all uppercase messages and removing swearwords.
exports.sendNotifications = functions.database
  .ref('/orders/{orderId}').onWrite(event => {
    const order = event.data.val();

    const orderId = event.params.orderId
    var statusName = "NOTACCEPTED";

    switch (order.status) {
      case 0:
        statusName = "NOTACCEPTED"
        break;
      case 1:
        statusName = "ONGOING"
        break;
      case 2:
        statusName = "CANCEL"
        break;
      case 3:
        statusName = "FINISHED"
        break;
      default:
        statusName = "REJECTED"
        break;
    }

    console.log('Current status: ', order.status);


    console.log('customer id', order.customerId);
    console.log('supplier id', order.supplierId);
    const customerRef = admin.database().ref(`/customers/${order.customerId}`).once('value');
    const supplierRef = admin.database().ref(`/suppliers/${order.supplierId}`).once('value');
    var customerToken = ""
    var supplierToken = ""

    return Promise.all([customerRef, supplierRef]).then(result => {

      const customer = result[0].val()
      const supplier = result[1].val()


      if (customer.token != null && supplier.token != null) {

        console.log('customer Token = ', customer.token);
        console.log('supplier Token = ', supplier.token);

        const payload = {
          notification: {
            title: `Elite Condos Notifications`,
            body: `Đơn hàng #${orderId} đã thay đổi trạng thái:  ${statusName}`,
            sound: "default",
            badge: "1"
          }
        };
        var tokens = [customer.token, supplier.token];
        // const token = 'ceXjM0hwwKs:APA91bGW0S0JWc4Kk9wwl3VTiRNR_23JZcKxST10NWOeOl5TqBoRgI7ypp9LcQNde6d3cEf25HKkVuFlw6zTjXdgjV7dolgLFwWpJwCJA1BBXd1uSu-puZBy_ZP786O7uJ9nTtOqoDOL';
        // Get the list of device notification tokens.
        // const getDeviceTokensPromise = admin.database().ref(`/users/${followedUid}/notificationTokens`).once('value');
        // Update the Firebase DB with checked message.
        // console.log('Message has been moderated. Saving to DB: ', moderatedMessage);
        console.log(' Tokens array = ', tokens);
        // const message1 = admin.messaging().sendToDevice(tokens, payload)
        return admin.messaging().sendToDevice(tokens, payload).then(response => {
          console.log('response', response)
        })
      }

    })
  });
