// Startup Functions
Meteor.startup(function () {
  var fs = Meteor.npmRequire("fs");
  var path = Meteor.npmRequire("path");

  var settings_text;
  try {
    settings_text = Assets.getText('config.json');
  } catch (err) {
    console.log("Could not find 'config.json' in default location.");
    var settings_path = process.env.SETTINGS_FILE;
    console.log("Looking for it in", settings_path);

    settings_text = fs.readFileSync(settings_path);
  }
  var settings = JSON.parse(settings_text);

  // Create the admin
  createAdmin(settings.admin.username, settings.admin.password);

  // Clear Service integrations
  ServiceConfiguration.configurations.remove({});

  // Add Service Integrations
  addServiceIntegration('github', settings.github);
  addFacebookIntegration(settings.facebook);
  addServiceIntegration('google', settings.google);
  addCustomIntegration(settings.cas);

  // Add Base Settings
  setBasicSettings(settings);

  Accounts.onCreateUser(function (options, user) {
    if (options.profile) {
      user.profile = options.profile;

      if (settings.defaultMentor) {
        user.profile.mentor = true;
      }
    }

    return user;
  });

});

function createAdmin(username, password) {
  var user = Meteor.users.findOne({
    username: username
  });

<<<<<<< HEAD
  if (!user) {
    Accounts.createUser({
=======
  if (!user){
    user = Accounts.createUser({
>>>>>>> 40bd0cea75017f56139128e3207cbea9200b7dd5
      username: username,
      password: password,
      profile: {
        name: 'Admin'
      }
    });
  }

  Accounts.setPassword(user, password);

  Meteor.users.update({
    username: username
  }, {
    $set: {
      'profile.admin': true
    }
  });
}

function addServiceIntegration(service, config) {
  if (config.enable) {
    ServiceConfiguration.configurations.upsert({
      service: service
    }, {
      $set: {
        clientId: config.clientId,
        secret: config.secret
      }
    });
  }
}

function addCustomIntegration(cas) {
  if (cas.enable) {
    ServiceConfiguration.configurations.upsert({
      service: 'cas'
    }, {
      $set: {
        data: cas
      }
    });
    Meteor.settings.public.cas = cas.public.cas;
    Meteor.settings.cas = cas.cas;
  }
}

function addFacebookIntegration(fb) {
  if (fb.enable) {
    ServiceConfiguration.configurations.upsert({
      service: 'facebook'
    }, {
      $set: {
        appId: fb.appId,
        secret: fb.secret
      }
    });
  }
}

function setBasicSettings(config) {
  // Check if the settings document already exists
  var settings = Settings.find({}).fetch();
  if (settings.length == 0 || settings.length > 1) {
    // Remove all documents and then create the singular settings document.
    Settings.remove({});
    Settings.insert(config.settings);
  }
}

// reads configuration overrides from environment variables according to a
// template object
//
// name are mapped to environment variables like
// 'foo.bar.bazQuux' -> 'FOO_BAR_BAZ_QUUX'
function readConfigsFromEnv(template) {
  function rec(template, pathElems) {
    var config = {};
    for (var key in template) {
      if (!template.hasOwnProperty(key)) {
        continue;
      }
      var value = template[key];
      var upperCased = key.replace(
        /([A-Z])/g,
        function(c) { return '_' + c.toLowerCase(); }
      ).toUpperCase();
      var elems = pathElems.concat([upperCased]);
      var envName = elems.join('_');
      switch (typeof value) {
        case 'object':
          config[key] = rec(value, elems);
          break;
        case 'string':
          if (typeof process.env[envName] !== 'undefined') {
            config[key] = process.env[envName];
          }
          break;
        case 'boolean':
          var parsedBool = parseBool(process.env[envName]);
          if (parsedBool !== null) {
            config[key] = parsedBool;
          }
          break;
        case 'number':
          var parsedInt = parseInt(process.env[envName]);
          if (!isNaN(parsedInt)) {
            config[key] = parsedInt;
          }
          break;
        default:
          throw 'unsupported type: ' + (typeof value);
      }
    }
    return config;
  }
  function parseBool(str) {
    if (str) {
      if (!isNaN(str)) {
        // numeric string
        return +str > 0;
      } else {
        return /^t/i.test(str) || /^y/i.test(str); // accepts things like 'True' and "yes"
      }
    } else {
      return null;
    }
  }
  return rec(template, []);
}

// updates a base object using the values in an overlay object, leaving all
// other values in the base object intact
function overlay(base, object) {
  for (var key in object) {
    if (!object.hasOwnProperty(key)) {
      continue;
    }
    if (typeof object[key] === 'object' && typeof base[key] === 'object') {
      overlay(base[key], object[key]);
    } else {
      base[key] = object[key];
    }
  }
}
