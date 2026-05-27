const { withAndroidManifest } = require('expo/config-plugins');

const WHATSAPP_PACKAGES = ['com.whatsapp', 'com.whatsapp.w4b'];

function packageQuery(name) {
  return { package: [{ $: { 'android:name': name } }] };
}

function hasPackageQuery(queries, packageName) {
  return queries.some((query) =>
    query.package?.some((entry) => entry.$?.['android:name'] === packageName),
  );
}

function addWhatsAppQueries(androidManifest) {
  const manifest = androidManifest.manifest;
  const queries = manifest.queries ?? [];

  for (const packageName of WHATSAPP_PACKAGES) {
    if (!hasPackageQuery(queries, packageName)) {
      queries.push(packageQuery(packageName));
    }
  }

  const hasWhatsAppScheme = queries.some((query) =>
    query.intent?.some((intent) =>
      intent.data?.some((data) => data.$?.['android:scheme'] === 'whatsapp'),
    ),
  );

  if (!hasWhatsAppScheme) {
    queries.push({
      intent: [
        {
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          data: [{ $: { 'android:scheme': 'whatsapp' } }],
        },
      ],
    });
  }

  manifest.queries = queries;
  return androidManifest;
}

/** Allows Linking.canOpenURL('whatsapp://...') on Android 11+. */
module.exports = function withWhatsAppQueries(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addWhatsAppQueries(config.modResults);
    return config;
  });
};
