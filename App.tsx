import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  Button,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pusher,
  PusherMember,
  PusherChannel,
  PusherAuthorizerResult,
} from '@pusher/pusher-websocket-react-native';

export default function App() {
  let logLines: string[] = [];
  const pusher = Pusher.getInstance();

  const [apiKey, onChangeApiKey] = React.useState('9e604d725d5bd7b20baa');
  const [cluster, onChangeCluster] = React.useState('ap2');
  const [channelName, onChangeChannelName] = React.useState(
    'private-vinay-channel',
  );
  const [eventName, onChangeEventName] = React.useState('some-event');
  const [eventData, onChangeEventData] = React.useState('');
  const [members, onChangeMembers] = React.useState<PusherMember[]>([]);


  const connect = async () => {
    try {
      await AsyncStorage.multiSet([
        ['APIKEY', apiKey],
        ['CLUSTER', cluster],
        ['CHANNEL', channelName],
      ]);

      await pusher.init({
        apiKey,
        cluster,
        onAuthorizer,
        onConnectionStateChange,
        onError,
        onEvent,
        onSubscriptionSucceeded,
        onSubscriptionError,
        onSubscriptionCount,
        onDecryptionFailure,
        onMemberAdded,
        onMemberRemoved,
      });

      await pusher.connect();
      await pusher.subscribe({channelName});
    } catch (e) {
      console.log('ERROR: ' + e);
    }
  };

  const onConnectionStateChange = (
    currentState: string,
    previousState: string,
  ) => {
    console.log(
      `onConnectionStateChange. previousState=${previousState} newState=${currentState}`,
    );
  };

  const onError = (message: string, code: Number, error: any) => {
    console.log(`onError: ${message} code: ${code} exception: ${error}`);
  };

  const onEvent = (event: any) => {
    console.log(`onEvent: ${event}`);
  };

  const onSubscriptionSucceeded = (channelName: string, data: any) => {
    console.log(
      `onSubscriptionSucceeded: ${channelName} data: ${JSON.stringify(data)}`,
    );
    const channel: PusherChannel = pusher.getChannel(channelName);
    const me = channel.me;
    onChangeMembers([...channel.members.values()]);
    console.log(`Me: ${me}`);
  };

  const onSubscriptionCount = (
    channelName: string,
    subscriptionCount: Number,
  ) => {
    console.log(
      `onSubscriptionCount: ${subscriptionCount}, channelName: ${channelName}`,
    );
  };

  const onSubscriptionError = (
    channelName: string,
    message: string,
    e: any,
  ) => {
    console.log(`onSubscriptionError: ${message}, channelName: ${channelName} e: ${e}`);
  };

  const onDecryptionFailure = (eventName: string, reason: string) => {
    console.log(`onDecryptionFailure: ${eventName} reason: ${reason}`);
  };

  const onMemberAdded = (channelName: string, member: PusherMember) => {
    console.log(`onMemberAdded: ${channelName} user: ${member}`);
    const channel: PusherChannel = pusher.getChannel(channelName);
    onChangeMembers([...channel.members.values()]);
  };

  const onMemberRemoved = (channelName: string, member: PusherMember) => {
    console.log(`onMemberRemoved: ${channelName} user: ${member}`);
    const channel: PusherChannel = pusher.getChannel(channelName);
    onChangeMembers([...channel.members.values()]);
  };

  const onAuthorizer = async (channelName: string, socketId: string) => {
    console.log(
      `calling onAuthorizer. channelName=${channelName}, socketId=${socketId}`,
    );

    const response = await fetch('http://192.168.1.9:3000/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        socket_id: socketId,
        channel_name: channelName,
      }),
    });

    const body = (await response.json()) as PusherAuthorizerResult;

    console.log(`response: ${JSON.stringify(body)}`);
    return body;
  };

  const trigger = async () => {
    /**
     * Triggering Event from Mobile app
     * 
      try {
        await AsyncStorage.multiSet([
          ['EVENT', eventName],
          ['DATA', eventData],
        ]);

        await pusher.trigger(
          new PusherEvent({ channelName, eventName, data: eventData })
        );
      } catch (e) {
        log('ERROR: ' + e);
      }
     * 
     *  */ 
    
    const response = await fetch('http://192.168.1.9:3000/triggerEvent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: eventData,
      }),
    });

    // const body = await response.json();

    console.log(`[event triggered]`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>
          {pusher.connectionState === 'DISCONNECTED'
            ? 'Pusher Channels React Native Example'
            : channelName}
        </Text>
      </View>
      {pusher.connectionState !== 'CONNECTED' ? (
        <>
          <TextInput
            style={styles.input}
            onChangeText={onChangeApiKey}
            placeholder="API Key"
            autoCapitalize="none"
            value={apiKey}
          />
          <TextInput
            style={styles.input}
            onChangeText={onChangeCluster}
            value={cluster}
            placeholder="Cluster"
            autoCapitalize="none"
            keyboardType="default"
          />
          <TextInput
            style={styles.input}
            onChangeText={onChangeChannelName}
            value={channelName}
            placeholder="Channel"
            autoCapitalize="none"
            keyboardType="default"
          />
          <Button
            title="Connect"
            onPress={connect}
            disabled={!(apiKey && cluster && channelName)}
          />
        </>
      ) : (
        <>
          <FlatList
            style={styles.list}
            data={members}
            renderItem={({item}) => (
              <Text style={styles.listItem}>
                {JSON.stringify(item.userInfo)} {item.userId}
              </Text>
            )}
          />
          <TextInput
            style={styles.input}
            onChangeText={onChangeEventName}
            value={eventName}
            placeholder="Event"
            autoCapitalize="none"
            keyboardType="default"
          />
          <TextInput
            style={styles.input}
            onChangeText={onChangeEventData}
            value={eventData}
            placeholder="Data"
            autoCapitalize="none"
            keyboardType="default"
          />
          <Button
            title="Trigger Event"
            onPress={trigger}
            disabled={!eventName}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 10,
  },
  image: {},
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  input: {
    height: 40,
    marginVertical: 12,
    borderWidth: 1,
    padding: 10,
  },
  list: {
    height: 100,
    borderWidth: 1,
    flexGrow: 0,
  },
  listItem: {
    borderWidth: 1,
  },
});
