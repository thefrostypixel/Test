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
  echo -e "\e[2J\e[3J\e[H\e[0It seems like your operating system is not supported"
  echo -e "However we might be wrong, so what is your operating system?"
  while [ "$OS" == "unknown" ]; do
    echo -e "Please always answer with \e[33mWindows\e[0m, \e[33mMacOS\e[0m, \e[33mLinux\e[0m or \e[33mother\e[0m"
    read -p "> $(echo -e "\e[33m")" OS
    echo -e -n "\e[0m"
    if [[ "$OS" == "Windows" || "$OS" == "MacOS" || "$OS" == "Linux" || "$OS" == "other" ]]; then
      if [ "$OS" == "other" ]; then
        echo -e "Then unfortunatly you can't use WB, sorry"
        exit
      fi
    else
      OS="unknown"
    fi
  done
fi
TOS="unknown"
while [ "$TOS" == "unknown" ]; do
  echo -e "\e[2J\e[3J\e[H\e[0mDo you agree to the Terms of Service?   \e[36mhttps://thefrostypixel.github.io/Test/en/TermsOfService.html\e[0m"
  echo -e "Please answer with \e[33myes\e[0m or \e[33mno\e[0m"
  read -p "> $(echo -e "\e[33m")" TOS
  echo -e -n "\e[0m"
  if [ "$TOS" != "yes" ]; then
    if [ "$TOS" == "no" ]; then
      echo -e "Then you can't use WB - Goodbye!"
      exit
    else
      TOS="unknown"
    fi
  fi
done
AIA="unknown"
if [[ -f "$HOME/.wb" || -d "$HOME/.wb" ]]; then
  while [ "$AIA" == "unknown" ]; do
    echo -e "It seems like WB is already installed, what do you want to do?"
    echo -e "Please answer with \e[33mreplace\e[0m, \e[33mupdate\e[0m or \e[33mcancel\e[0m"
    read -p "> $(echo -e "\e[33m")" AIA
    echo -e -n "\e[0m"
    if [ "$AIA" == "replace" ]; then
      rm -r -f "$HOME/.wb"
    elif [ "$AIA" == "update" ]; then
      $HOME/.wb/wb "update"
      exit
    elif [ "$AIA" == "cancel" ]; then
      echo -e "Goodbye!"
      exit
    else
      AIA="unknown"
    fi
  done
fi
echo -e "Downloading..."
curl --http0.9 -o "$HOME/.WB.zip" "https://thefrostypixel.github.io/Test/WB.zip" > /dev/null 2>&1
if [ "$OS" == "Linux" ]; then
  curl --http0.9 -o "$HOME/.java17.tar.gz" "https://download.oracle.com/java/17/archive/jdk-17_linux-aarch64_bin.tar.gz" > /dev/null 2>&1
  echo -e "Installing..."
  unzip "$HOME/.WB.zip" -d "$HOME" > /dev/null 2>&1
  tar -xf "$HOME/.java17.tar.gz" -C "$HOME/.wb/code"
  rm "$HOME/.java17.tar.gz"
elif [ "$OS" == "MacOS" ]; then
  curl --http0.9 -o "$HOME/java17.tar.gz" "https://download.oracle.com/java/17/archive/jdk-17_macos-aarch64_bin.tar.gz" > /dev/null 2>&1
  echo -e "Installing..."
  unzip "$HOME/.WB.zip" -d "$HOME" > /dev/null 2>&1
  tar -xf "$HOME/.java17.tar.gz" -C "$HOME/.wb/code"
  rm "$HOME/.java17.tar.gz"
else
  curl --http0.9 -o "$HOME/.java17.zip" "https://download.oracle.com/java/17/archive/jdk-17_windows-x64_bin.zip" > /dev/null 2>&1
  echo -e "Installing..."
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
  echo -e "Successfully installed WB!"
  echo -e "Do you want to run it?"
  echo -e "Please answer with \e[33myes\e[0m or \e[33mno\e[0m"
  read -p "> $(echo -e "\e[33m")" RUN
  echo -e -n "\e[0m"
  if [[ "$RUN" != "yes" && "$RUN" != "no" ]]; then
    RUN="unknown"
  fi
done
if [ "$RUN" == "yes" ]; then
  bash "$HOME/.wb/wb"
else
  echo -e "Goodbye!"
fi
