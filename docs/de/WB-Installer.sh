if [ ! -t 0 ]; then
  konsole --noclose -e "$0"
  exit
fi
OS="unknown"
if [[ $(uname | tr [:upper:] [:lower:]) == "linux"* ]]; then
  OS="Linux"
elif [[ $(uname | tr [:upper:] [:lower:]) == "darwin"* ]]; then
  OS="MacOS"
elif [[ $(uname | tr [:upper:] [:lower:]) == "msys"* ]]; then
  OS="Windows"
else
  echo -e "\e[2J\e[3J\e[H\e[0Es sieht so als, als würden wir dein Betriebssystem nicht unterstützen"
  echo -e "Aber wir könnten falsch liegen, also was ist dein Betriebsystem?"
  while [ "$OS" == "unknown" ]; do
    echo -e "Bitte antworte mit \e[33mWindows\e[0m, \e[33mMacOS\e[0m, \e[33mLinux\e[0m oder \e[33manderes\e[0m"
    read -p "> $(echo -e "\e[33m")" OS
    echo -e -n "\e[0m"
    if [[ "$OS" == "Windows" || "$OS" == "MacOS" || "$OS" == "Linux" || "$OS" == "anderes" ]]; then
      if [ "$OS" == "anderes" ]; then
        echo -e "Dann kannst du WB leider nicht benutzen"
        exit
      fi
    else
      OS="unknown"
    fi
  done
fi
TOS="unknown"
while [ "$TOS" == "unknown" ]; do
  echo -e "\e[2J\e[3J\e[H\e[0mBist du mit den Nutzzungsbedingungen einverstanden?   \e[36mhttp://127.0.0.1:3000/de/TermsOfService.html\e[0m"
  echo -e "Bitte antworte mit \e[33mja\e[0m oder \e[33mnein\e[0m"
  read -p "> $(echo -e "\e[33m")" TOS
  echo -e -n "\e[0m"
  if [ "$TOS" != "ja" ]; then
    if [ "$TOS" == "nein" ]; then
      echo -e "Dann kannst du WB nicht nutzen - Tschüss!"
      exit
    else
      TOS="unknown"
    fi
  fi
done
AIA="unknown"
if [[ -f "$HOME/.wb" || -d "$HOME/.wb" ]]; then
  while [ "$AIA" == "unknown" ]; do
    echo -e "Es sieht so aus, als wäre WB bereits installiert, was möchtest du tun?"
    echo -e "Bitte antworte mit \e[33mersetzen\e[0m, \e[33maktualisieren\e[0m oder \e[33mabbrechen\e[0m"
    read -p "> $(echo -e "\e[33m")" AIA
    echo -e -n "\e[0m"
    if [ "$AIA" == "erstzen" ]; then
      rm -r -f "$HOME/.wb"
    elif [ "$AIA" == "aktualisieren" ]; then
      $HOME/.wb/wb "update"
      exit
    elif [ "$AIA" == "abbrechen" ]; then
      echo -e "Tschüss!"
      exit
    else
      AIA="unknown"
    fi
  done
fi
echo -e "Herunterladen..."
curl --http0.9 -o "$HOME/.WB.zip" "http://127.0.0.1:3000/WB.zip" > /dev/null 2>&1
if [ "$OS" == "Linux" ]; then
  curl --http0.9 -o "$HOME/.java17.tar.gz" "https://download.oracle.com/java/17/archive/jdk-17_linux-aarch64_bin.tar.gz" > /dev/null 2>&1
  echo -e "Installieren..."
  unzip "$HOME/.WB.zip" -d "$HOME" > /dev/null 2>&1
  tar -xf "$HOME/.java17.tar.gz" -C "$HOME/.wb/code"
  rm "$HOME/.java17.tar.gz"
elif [ "$OS" == "MacOS" ]; then
  curl --http0.9 -o "$HOME/java17.tar.gz" "https://download.oracle.com/java/17/archive/jdk-17_macos-aarch64_bin.tar.gz" > /dev/null 2>&1
  echo -e "Installieren..."
  unzip "$HOME/.WB.zip" -d "$HOME" > /dev/null 2>&1
  tar -xf "$HOME/.java17.tar.gz" -C "$HOME/.wb/code"
  rm "$HOME/.java17.tar.gz"
else
  curl --http0.9 -o "$HOME/.java17.zip" "https://download.oracle.com/java/17/archive/jdk-17_windows-x64_bin.zip" > /dev/null 2>&1
  echo -e "Installieren..."
  unzip "$HOME/.WB.zip" -d "$HOME" > /dev/null 2>&1
  unzip "$HOME/.java17.zip" -d "$HOME/.wb/code" > /dev/null 2>&1
  rm "$HOME/.java17.zip"
fi
rm "$HOME/.WB.zip"
mkdir "$HOME/.wb/code/java"
mv "$HOME/.wb/code/jdk-17/bin/java" "$HOME/.wb/code/java/wb"
mkdir "$HOME/.wb/code/lib"
mv "$HOME/.wb/code/jdk-17/lib/server" "$HOME/.wb/code/lib"
mv "$HOME/.wb/code/jdk-17/lib/jvm.cfg" "$HOME/.wb/code/lib"
mv "$HOME/.wb/code/jdk-17/lib/"*.so "$HOME/.wb/code/lib"
mv "$HOME/.wb/code/jdk-17/lib/modules" "$HOME/.wb/code/lib"
mv "$HOME/.wb/code/jdk-17/lib/tzdb.dat" "$HOME/.wb/code/lib"
rm -r -f "$HOME/.wb/code/jdk-17"
#   —————   C R E A T E    D E S K T O P    S H O R T C U T   —————   #
RUN="unknown"
while [ "$RUN" == "unknown" ]; do
  echo -e "WB wurde erfolgreich installiert!"
  echo -e "Möchtest du es ausführen?"
  echo -e "Bitte antworte mit \e[33mjae[0m oder \e[33mnein\e[0m"
  read -p "> $(echo -e "\e[33m")" RUN
  echo -e -n "\e[0m"
  if [[ "$RUN" != "ja" && "$RUN" != "nein" ]]; then
    RUN="unknown"
  fi
done
if [ "$RUN" == "ja" ]; then
  bash "$HOME/.wb/wb"
else
  echo -e "Tschüss!"
fi
