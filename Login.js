import React, { useEffect, useState } from "react";
import {
  View, Text,TextInput,Pressable, StyleSheet,Alert,} from "react-native";
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,} from "firebase/auth";
import { auth } from "./firebase";
import { useAuth } from "./AuthContext";
import { getFirestore, doc, setDoc } from "firebase/firestore";

export default function Login({ navigation }) {
const db = getFirestore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserID } = useAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserID(user.uid);
      }
    });
    return unsubscribe;
  }, [navigation, setUserID]);

  function handleLogin() {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigation.navigate("HomeScreen");
      })
      .catch((error) => Alert.alert(error.message));
  }

  function handleSignUp() {
    createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
        // Get the user UID
        const user = userCredential.user;
        const userID = user.uid;
  
        // Store the user data in Firestore 'users' collection
        await setDoc(doc(db, "users", userID), {
          email: user.email,
        });
  
        // Set the user ID 
        setUserID(userID);
  
        // Navigate to the HomeScreen
        navigation.navigate("HomeScreen");
      })
      .catch((error) => Alert.alert(error.message));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.H1}>MovieTracker</Text>
      </View>

      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <Text style={styles.H2}>Login to Your Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>

          <Text style={styles.or}>or</Text>

          <Pressable style={styles.buttonSecondary} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "black",
    },
    header: {
      paddingTop: 50,
      paddingBottom: 10,
      alignItems: "center",
    },
    H1: {
      color: "white",
      fontWeight: "bold",
      fontSize: 36,
    },
    H2: {
      fontWeight: "bold",
      color: "white",
      fontSize: 18,
      marginBottom: 20,
      textAlign: "center",
    },
    loginContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loginCard: {
      width: "85%",
      backgroundColor: "#1e1e1e",
      padding: 20,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    input: {
      height: 45,
      borderWidth: 1,
      borderColor: "#444",
      backgroundColor: "#fff",
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 15,
      fontSize: 14,
    },
    button: {
      backgroundColor: "#FF4500",
      paddingVertical: 12,
      borderRadius: 30,
      alignItems: "center",
      marginTop: 10,
    },
    buttonSecondary: {
      backgroundColor: "#333",
      paddingVertical: 12,
      borderRadius: 30,
      alignItems: "center",
      marginTop: 10,
    },
    buttonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "bold",
    },
    or: {
      color: "#aaa",
      fontStyle: "italic",
      textAlign: "center",
      marginVertical: 8,
    },
  });
  