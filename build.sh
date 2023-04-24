echo "Building frontend..."
cd `dirname $0`
cd frontend
yarn install
yarn build
rm -rf ../backend/public
mkdir ../backend/public
cp -r build/* ../backend/public/