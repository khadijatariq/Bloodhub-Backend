const functions = require('firebase-functions');
const admin = require('firebase-admin');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

admin.initializeApp(functions.config().firebase);

var blood_groups = ["A+","B+","AB+","O+","A-","B-","AB-","O-"];

exports.sendRequestToBloodGroup = functions.database.ref('/bloodrequests/{bloodrequestsId}')
        .onWrite(event => {
	 
	        // Grab the current value of what was written to the Realtime Database.
	        var eventSnapshot = event.data;
	        var id = event.params.bloodrequestsId;
	 
	        var topic = "Request_"+blood_groups.indexOf(eventSnapshot.child("blood_group").val());
	        var payload = {
	            notification: {
	                title: eventSnapshot.child("quantity").val()+" bag(s) of "+eventSnapshot.child("blood_group").val()+" needed",
	                body: "Location: "+eventSnapshot.child("location").val()
	            },
	            data: {
	            	notificationKey: "1",
	            	requestId: id
	            }
	        };

	        // Send a message to devices subscribed to the provided topic.
	        return admin.messaging().sendToTopic(topic, payload)
	            .then(function (response) {
	                console.log("Successfully sent message:", response);
	            })
	            .catch(function (error) {
	                console.log("Error sending message:", error);
	            });
        });

exports.sendResponseToRequest = functions.database.ref('/donations/{donationsId}')
        .onWrite(event => {
 
	        // Grab the current value of what was written to the Realtime Database.
	        var eventSnapshot = event.data;
	        var id = event.params.donationsId;
	 
	 		return admin.database().ref("bloodrequests/"+eventSnapshot.child("requestid").val()).once("value").then(function(snapshot){
	 			var request = snapshot.val();
	 			var registrationToken = request.regToken;

	 			admin.database().ref("users/"+eventSnapshot.child("userid").val()).once("value").then(function(snapshot){
	 				var user = snapshot.val();
			        var payload = {
			            notification: {
			                title:  user.username+" responded to your request",
			                body: "Needed: "+request.quantity+" bag(s) of "+request.blood_group+" at "+request.location
			            },
			            data: {
			            	notificationKey: "2",
			            	userId: eventSnapshot.child("userid").val(),
			            	donationId: id
			            }
			        };
			 
			        // Send a message to devices subscribed to the provided topic.
			        admin.messaging().sendToDevice(registrationToken, payload)
			            .then(function (response) {
			                console.log("Successfully sent message:", response);
			            })
			            .catch(function (error) {
			                console.log("Error sending message:", error);
			            });
			    });
	 		});
    	});
