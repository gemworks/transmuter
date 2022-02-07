# ------- copy IDLs into apps
#cp ./target/idl/gem_farm.json ./app/gem-farm/public/

# ------- copy types into SDK
cp -r ./target/types ./src

echo IDLs and Types copied!