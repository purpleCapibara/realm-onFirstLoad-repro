import React from 'react';
import {SafeAreaView, Text, View, Switch} from 'react-native';

import Realm, {type Configuration, type ObjectSchema} from 'realm';
import {createRealmContext} from '@realm/react';

Realm.setLogger(log => {
  console.log('realm log', log.level, log.message, log.category);
});

Realm.setLogLevel('all');

const RealmFeatureFlag = {
  enableExperimentalFeature1: 'enableExperimentalFeature1',
  enableExperimentalFeature2: 'enableExperimentalFeature2',
  enableExperimentalFeature3: 'enableExperimentalFeature3',
} as const;

const REALM_TYPE_FEATURE_FLAGS = 'FeatureFlags';

const FeatureFlagsSchema: ObjectSchema = {
  name: REALM_TYPE_FEATURE_FLAGS,
  properties: {
    name: 'string',
    value: 'bool',
  },
  primaryKey: 'name',
};

export const RealmSchema = [FeatureFlagsSchema];

export const realmConfig: Configuration = {
  schema: RealmSchema,
  // Realm does not trigger onFirstOpen callback
  // when trying to read value from schema in
  onFirstOpen: realm => {
    console.log('initialising realm');

    // initialise feature flags
    Object.entries(RealmFeatureFlag).forEach(([, value]) => {
      realm.create(
        REALM_TYPE_FEATURE_FLAGS,
        {
          name: value,
          value: false,
        },
        Realm.UpdateMode.Never,
      );
    });
  },
};

const realm = new Realm(realmConfig);

const {RealmProvider, useRealm, useObject} =
  createRealmContext(realm);

const useFeatureFlag = (name: keyof typeof RealmFeatureFlag) => {
  const realm = useRealm();
  const featureFlag = useObject<{name: string; value: boolean}>(
    REALM_TYPE_FEATURE_FLAGS,
    name,
  );

  const setFeatureFlag = (state: boolean) => {
    if (!featureFlag) {
      return;
    }

    realm.write(() => {
      featureFlag.value = state;
    });
  };

  return [featureFlag?.value, setFeatureFlag] as const;
};

function FeatureFlagView() {
  const [x, setX] = useFeatureFlag('enableExperimentalFeature1');

  console.log('featureFlag value', x);

  return (
    <View>
      <Switch value={x} onChange={() => setX(!x)} />
      <Text>Current feature flag state: {String(x)}</Text>
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <RealmProvider
    // Running onFirstOpen as a prop yields the same result, Realm does not trigger the callback
    // onFirstOpen={() => {
    //   console.log('test in a context');
    // }}
    >
      <SafeAreaView>
        <FeatureFlagView />
      </SafeAreaView>
    </RealmProvider>
  );
}

export default App;
