# hubUser=alvinscrp
# imageName=coverage-admin
# #v0.0.3
# version=$1
# image_with_version=$imageName:$version
# docker buildx build --platform linux/amd64 . -t $image_with_version
# docker tag $image_with_version $hubUser/$image_with_version
# docker push $hubUser/$image_with_version
hubUser=alvinscrp
imageName=coverage-server
docker buildx build --platform linux/amd64 . -t $imageName
docker tag $imageName $hubUser/$imageName
docker push $hubUser/$imageName