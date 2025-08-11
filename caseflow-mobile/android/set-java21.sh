#!/bin/bash

# Set Java 21 environment for Android build
export JAVA_HOME=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

echo "Java environment set:"
echo "JAVA_HOME: $JAVA_HOME"
echo "Java version:"
java -version

# Run the gradle command with Java 21
exec "$@"
