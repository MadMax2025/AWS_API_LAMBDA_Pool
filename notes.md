# Init
sudo apt-get update & upgrade

# Install python 3.9 
sudo apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev wget
wget https://www.python.org/ftp/python/3.9.19/Python-3.9.19.tgz
tar -xf Python-3.9.19.tgz
cd Python-3.9.19
./configure --enable-optimizations --prefix=/usr/local
make -j 2
sudo make altinstall
python3.9 --version
python3.9 -c "import ssl; print(ssl.OPENSSL_VERSION)"
cd ..
sudo rm -rf Python-3.9.19*


# Create profile aws cli
sudo apt install unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version

# create profile
aws configure --profile awsUtpc
- Access key: 
- Secret access key: 
- region: 

aws configure list-profiles
aws s3 ls --profile awsUtpc



# install node npm nvm 
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
source ~/.bashrc
nvm --version
nvm install 20
node -v
npm -v

# Install cdk

npm install -g aws-cdk
mkdir utpc-cdk && cd utpc-cdk
cdk init app --language typescript
cdk list
npm run build
cdk synth --profile awsUtpc --verbose

# installl gh to connect github 
sudo apt install gh
gh auth login

# install yarn 
npm install -g yarn
yarn --version

# execute cdk 
yarn add aws-cdk-lib
cdk bootstrap --profile awsUtpc  #  Only Once
cdk deploy --profile awsUtpc
cdk destroy --profile awsUtpc



# create python virtual environment 
python3.9 -m venv 1-ven
source 1-ven/bin/activate
pip install mysql-connector-python==8.4.0 -t ./lib/layers/mysqlConnector/python/lib/python3.9/site-packages/


# download repository
git clone https://github.com/Emilita2006/1-ApiLambdaMysqlAws.git

