/* Author:

*/
if (window.location.search.length > 0) {
  var channelNumber = window.location.search.substring(1);
} else {
  var channelNumber = getRandomInt(1,10000);
  PUBNUB.publish({             // SEND A MESSAGE.
      channel : channelNumber,
      message : {type: 'optionsUpdate', content: ''} // To send a blank canvas if others join
                                                     // so they don't see possible old options
  });
}

console.log('Channel Number is '+channelNumber);
$('#channelLink').html('<a href="/?'+channelNumber+'">'+window.location.hostname+'/?'+channelNumber+'</a>');

// LISTEN FOR MESSAGES
PUBNUB.subscribe({
    channel    : channelNumber,      // CONNECT TO THIS CHANNEL.

    restore    : false,              // STAY CONNECTED, EVEN WHEN BROWSER IS CLOSED
                                     // OR WHEN PAGE CHANGES.

    callback   : function(message) { // RECEIVED A MESSAGE.
        console.log(message);
        switch(message.type) {
          case 'startDeciding':
            showChoice(message.content);
            break;
          case 'optionsUpdate':
            $('#givenInput').val(message.content);
            break;
          default:
            console.log('unknown message type:');
            console.log(message);
            break;
        }

    },

    connect    : function() {        // CONNECTION ESTABLISHED.

      PUBNUB.history( {
          channel : channelNumber,
          limit   : 5
      }, function(messages) {
          for (x in messages) {
            if (messages[x].type == 'optionsUpdate') {
              $('#givenInput').val(messages[x].content);
            }
          }
      } );

    }
});

$('#syncButton').tooltip({title: 'Click here to sync what you have as your options to the others viewing this page'});
$('#decideButton').tooltip({title: 'Click here to have The Decider make a choice and reveal it to everyone viewing this page'});

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomLetter() {
  letters = 'abcdefghijklmnopqrstuvwxyz';
  return letters[getRandomInt(0,25)];
}

function makeChoice(options) {
  var count = options.length;
  var selection = getRandomInt(0,count - 1);
  return options[selection];
}

function translateOptions(raw) {
  var options = raw.split("\n");
  for (var i = 0; i < options.length; i++) {
    if (options[i].length > 10) {
      return {outcome: false, content: 'long option'};
    }
  }
  if (i > 25) {
    return {outcome: false, content: 'too many options'};
  } else if (i < 2) {
    return {outcome: false, content: 'too few options'};
  }
  return {outcome: true, content: options};
}

function constructRevealObject(choice,length) {
  var revealObject = {};
  for (var i = 0; i < length; i++) {
    revealObject[i] = [' ',getRandomInt(16,40)];
  }
  for (var a = 0; a < choice.length; a++) {
    revealObject[a] = [choice[a],getRandomInt(16,40)];
  }
  console.log(revealObject);
  return revealObject;
}

function showChoice(revealObject) {
  $('#options').slideUp();
  $timer = 0;
  $('#decideButton').prop('disabled', true);
  var revealHandle = setInterval(function() {
        $timer++;
        if ($timer > 40) {
          $('#decideButton').prop('disabled', false);
          clearInterval(revealHandle);
        } else {
          currentShow = [];
          for (i in revealObject) {
            if ($timer >= revealObject[i][1]) {
              currentShow[i] = revealObject[i][0];
            } else {
              currentShow[i] = randomLetter();
            }
            $('#l'+i).text(currentShow[i]);
          }
        }
        },250);
}

function pushOptions(options,channelNum) {
  PUBNUB.publish({             // SEND A MESSAGE.
      channel : channelNum,
      message : {type: 'optionsUpdate', content:options}
  });
}

function startDeciding(givenData,channelNumber) {
  $('#syncButton').tooltip('hide');
  $('#decideButton').tooltip('hide');
  var options = translateOptions(givenData);
  if (options.outcome) {
    var choice = makeChoice(options.content);
    var revealObject = constructRevealObject(choice,10);
    PUBNUB.publish({
      channel : channelNumber,
      message : {type: 'startDeciding', content:revealObject}
    });
    pushOptions(givenData,channelNumber);
  } else {
    switch(options.content) {
      case 'long option':
        alert('Options must be no longer than 10 characters');
        break;
      case 'too many options':
        alert('Must have no more than 25 options');
        break;
      case 'too few options':
        alert('Must have at least 2 options!');
        break;
      default:
        alert('Could not decide because of some error!');
        break;
    }
  }
  return false;
}
