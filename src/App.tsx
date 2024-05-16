import {
  CaretLeftIcon,
  CaretRightIcon,
  Cross1Icon,
  ShadowIcon,
  ShadowInnerIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "./components/ui/dialog";
import { ChangeEvent, useEffect, useState } from "react";
import { database, storage } from "../firebase.config";
import { ref } from "firebase/storage";
import { getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import { addDoc, collection, getDocs, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import imageCompression from "browser-image-compression";

export default function App() {
  const [pics, setPics] = useState<
    { url: string; is_approved: boolean; date_added: number; id: string; file_name: string }[] | []
  >();
  const [imgStartIndex, setImageStartIndex] = useState(10);
  const [selectedFiles, setSelectedFiles] = useState<File[] | []>();
  const [selectedFileUrls, setSelectedFileUrls] = useState<string[] | []>();
  const [displayedImages, setDisplayedImages] = useState<
    { url: string; is_approved: boolean; date_added: number; id: string; file_name: string }[] | []
  >();

  const [picsLoading, setPicsLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [noOfPhotosUploaded, setNoOfPhotosUploaded] = useState(0);
  const [isApproved, setIsApproved] = useState(false)
  const [isDeleted, setIsDeleted] = useState(true)
  const [currentUrl, setCurrentUrl] = useState((pics && pics.length > 0 && pics[0].url) || "");
  const loadMoreImages = (startIndex = imgStartIndex) => {
    const selected = pics?.slice(0, startIndex + 10);
    setImageStartIndex((prev) => prev + 10);
    setDisplayedImages(selected);

  };


  useEffect(() => {
    async function getAllPics() {

      const picsRef = collection(database, "images");
      const imagesFromDb = window.location.pathname === "/admin" ? query(picsRef, where("is_approved", "==", false)) : query(picsRef, where("is_approved", "==", true))
      const querySnapshot = await getDocs(imagesFromDb);
      let pics: { url: string; is_approved: boolean; date_added: number; file_name: string; id: string }[] =
        [];
      let adminPics: { url: string; is_approved: boolean; date_added: number; file_name: string; id: string }[] =
        [];
      if (querySnapshot.docs.length > 0) {
        querySnapshot.forEach((doc) => {
          pics.push({
            url: doc.data().url,
            is_approved: doc.data().is_approved,
            date_added: doc.data().date_added,
            file_name: doc.data().file_name,
            id: doc.id,
          });
          adminPics.push({
            url: doc.data().url,
            is_approved: doc.data().is_approved,
            date_added: doc.data().date_added,
            file_name: doc.data().file_name,
            id: doc.id
          });
        });
        if(window.location.pathname === "/admin"){
          setPics(adminPics.sort((a, b) => b.date_added - a.date_added));
          setDisplayedImages(adminPics.sort((a, b) => b.date_added - a.date_added));
        }else{
        setPics(pics.sort((a, b) => b.date_added - a.date_added));
        setDisplayedImages(pics.sort((a, b) => b.date_added - a.date_added));
      }
      }
    }
    getAllPics();
  }, []);

  useEffect(() => {
    if (pics && pics.length > 0) {
      setPicsLoading(false);
    }
  }, [pics]);

  useEffect(() => {
    console.log({ imgStartIndex });
  }, [imgStartIndex]);
  async function compressImage(file: File) {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    try {
      const compressedImage = await imageCompression(file, options);
      return compressedImage;
    } catch (err) {
      console.log(err);
    }
  }

  async function uploadFilesToServer() {
    setUploadLoading(true);
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles?.length; i++) {
        const compressedImage = await compressImage(selectedFiles[i]);
        if (compressedImage) {
          await uploadImageAsPromise(compressedImage).then(() => {
            setNoOfPhotosUploaded(i);
          });
        }
      }
      setNoOfPhotosUploaded(0);
    }
    setUploadLoading(false);
    location.reload();
  }

  function uploadImageAsPromise(imageFile: File) {
    return new Promise<void>((resolve, reject) => {
      const fullDirectory = "wedding";
      const storageRef = ref(storage, `${fullDirectory}/${imageFile.name}`);

      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on(
        "state_changed",
        () => {
          // const percentage =
          //   (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // setTotalPercentage((formerValue) => (formerValue += percentage));
          // Update progress bar or any other UI element here if needed
        },
        (error) => {
          console.log(error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(database, "images"), {
            url: downloadURL,
            is_approved: false,
            date_added: Date.now(),
            file_name: imageFile.name
          });
          resolve();
        }
      );
    });
  }
  function activateCarouselByImageUrl(action: "back" | "forward") {
    if (pics) {
      setIsApproved(false)
      const activeImage = pics?.findIndex((pic) => currentUrl === pic.url);
      if (action === "back") {
        setCurrentUrl(pics[activeImage - 1].url);
      } else {
        setCurrentUrl(pics[activeImage + 1].url);
      }

      return pics[activeImage].url;
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files: File[] = [];
    const fileUrls: string[] = [];
    if (event.target.files) {
      for (let i = 0; i < event.target.files?.length; i++) {
        const fileItem = event.target.files.item(i);
        files.push(fileItem!);
        fileUrls.push(URL.createObjectURL(fileItem!));
      }
    }
    let newFiles: File[] = [];
    let newFileUrls: string[] = [];
    if (
      selectedFiles &&
      selectedFiles.length > 0 &&
      selectedFileUrls &&
      selectedFileUrls.length > 0
    ) {
      newFiles = [...files, ...selectedFiles];
      newFileUrls = [...fileUrls, ...selectedFileUrls];
      setSelectedFiles(newFiles);
      setSelectedFileUrls(newFileUrls);
    } else {
      setSelectedFiles(files);
      setSelectedFileUrls(fileUrls);
    }
  };
  const approveImage = async (id: string) => {
    setIsApproved(true)
    await updateDoc(doc(database, "images", id), {
      is_approved: true
    })
    const newPics = pics?.filter((pic) => pic.id === id)
    setPics(newPics)
    setDisplayedImages(newPics)
  }

  const deleteImage = async (id: string, file_name: string) => {
    const docRef = ref(storage, `wedding/${file_name}`)
    await deleteObject(docRef).then(async () => {
      await deleteDoc(doc(database, "images", id))
      console.log("Image yeeted, doc deleted.")
    })
    const newPics = pics?.filter((pic) => pic.id === id)
    setPics(newPics)
    setDisplayedImages(newPics)
  }


  const deleteFile = (url: string) => {
    const newFiles = selectedFileUrls?.filter((fileUrl) => fileUrl !== url);
    setSelectedFileUrls(newFiles);
  };

  if(window.location.pathname === "/admin"){
    return (
      <div className="h-screen overflow-y-scroll bg-[#f9f9f9]">
        <nav className="absolute top-0 p-4 bg-transparent flex items-center justify-center left-2 right-2 z-10 backdrop-filter backdrop-blur-sm">
          <a href="/admin">
          <img src="/logo.svg" className="w-[20px] h-[20px]" alt="" />
          </a>
        </nav>
        {picsLoading === true ? (
          <div className="w-full flex justify-center mt-20">
            <ShadowIcon className="animate-spin" stroke="#295639" />
          </div>
        ) : (
          <div className="mb-20">
            <div className="grid   w-[90%] max-w-[700px] place-items-center mt-20 mx-auto grid-cols-2  xl:grid-cols-3  grid-flow-row gap-1">
              {pics &&
                displayedImages &&
                displayedImages.map((pic, index) => (
                  <Dialog key={index}>
                    <div className="relative w-full h-full">
                      <DialogTrigger onClick={() => setCurrentUrl(pic.url)}>
                        <img
                          src={pic.url}
                          className=" w-full flex-1  h-full object-cover aspect-square  border shadow-md"
                        />
                      </DialogTrigger>
                      <DialogContent className="bg-transparent w-full border-none flex flex-col items-center">
                        <img
                          src={currentUrl}
                          className=" w-[100%] border-double  h-full object-cover   shadow-lg"
                        />
                        <div className="flex gap-6 items-center">
                          <button
                            className="w-[30px] h-[30px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
                            onClick={() => activateCarouselByImageUrl("back")}
                            disabled={
                              pics?.findIndex((pic) => currentUrl === pic.url) ===
                              0
                            }
                          >
                            <CaretLeftIcon stroke="#fff" />
                          </button>
                            <div className="flex flex-col gap-3 text-sm font-bold text-white">
                              <button onClick={() => approveImage(pic.id)}>
                                {isApproved ? "Approved" : "Approve"}
                              </button>
                              <button onClick={() => deleteImage(pic.id, pic.file_name)} className="text-red-500">
{isDeleted ? "Deleted" : "Delete"}
                              </button>
                            </div>
                          <button
                            className="w-[30px] h-[30px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
                            onClick={() => activateCarouselByImageUrl("forward")}
                            disabled={
                              pics
                                ? pics?.findIndex(
                                    (pic) => currentUrl === pic.url
                                  ) ===
                                  pics?.length - 1
                                : true
                            }
                          >
                            <CaretRightIcon stroke="#fff" />
                          </button>
                        </div>
                      </DialogContent>
                    </div>
                  </Dialog>
                ))}
            </div>
            <div className="w-fit mx-auto mt-4 ">
              {pics && pics.length > imgStartIndex ? (
                <button
                  onClick={() => loadMoreImages()}
                  className="text-center flex flex-col items-center"
                >
                  <ShadowInnerIcon
                    className="w-6 h-6 animate-bounce"
                    stroke="#295639"
                  />
                  <p className="text-sm font-medium">load more</p>
                </button>
              ) : (
                <></>
              )}
            </div>
          </div>
        )}
      </div>
    )  
  }

  return (
    <div className="h-screen overflow-y-scroll bg-[#f9f9f9]">
      <nav className="absolute top-0 p-4 bg-transparent flex items-center justify-center left-2 right-2 z-10 backdrop-filter backdrop-blur-sm">
        <img src="/logo.svg" className="w-[20px] h-[20px]" alt="" />
      </nav>
      {picsLoading === true ? (
        <div className="w-full flex justify-center mt-20">
          <ShadowIcon className="animate-spin" stroke="#295639" />
        </div>
      ) : (
        <div className="mb-20">
          <div className="grid   w-[98%] max-w-[700px] place-items-center mt-20 mx-auto grid-cols-2  xl:grid-cols-3  grid-flow-row ">
            {pics &&
              displayedImages &&
              displayedImages.map((pic, index) => (
                <Dialog key={index}>
                  <div className="relative w-full h-full">
                    <DialogTrigger onClick={() => setCurrentUrl(pic.url)}>
                      <img
                        src={pic.url}
                        className=" w-full flex-1  h-full object-cover aspect-square  border shadow-md"
                      />
                    </DialogTrigger>
                    <DialogContent className="bg-transparent w-full border-none flex flex-col items-center">
                      <img
                        src={currentUrl}
                        className=" w-[100%] border-double  h-full object-cover   shadow-lg"
                      />
                      <div className="flex gap-3">
                        <button
                          className="w-[30px] h-[30px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
                          onClick={() => activateCarouselByImageUrl("back")}
                          disabled={
                            pics?.findIndex((pic) => currentUrl === pic.url) ===
                            0
                          }
                        >
                          <CaretLeftIcon stroke="#fff" />
                        </button>

                        <button
                          className="w-[30px] h-[30px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
                          onClick={() => activateCarouselByImageUrl("forward")}
                          disabled={
                            pics
                              ? pics?.findIndex(
                                  (pic) => currentUrl === pic.url
                                ) ===
                                pics?.length - 1
                              : true
                          }
                        >
                          <CaretRightIcon stroke="#fff" />
                        </button>
                      </div>
                    </DialogContent>
                  </div>
                </Dialog>
              ))}
          </div>
          <div className="w-fit mx-auto mt-4 ">
            {pics && pics.length > imgStartIndex ? (
              <button
                onClick={() => loadMoreImages()}
                className="text-center flex flex-col items-center"
              >
                <ShadowInnerIcon
                  className="w-6 h-6 animate-bounce"
                  stroke="#295639"
                />
                <p className="text-sm font-medium">load more</p>
              </button>
            ) : (
              <></>
            )}
          </div>
        </div>
      )}

      <div className="absolute z-10 bg-transparent right-4  bottom-4">
        <Dialog>
          <DialogTrigger className="flex p-2  backdrop-blur-sm bottom-4  shadow-lg text-black  rounded-full">
            <UploadIcon className="h-8 w-8 rounded-full " />
          </DialogTrigger>
          <DialogContent
            aria-description="a"
            className="min-h-[500px] flex flex-col max-w-[500px] w-[95%] "
          >
            <div className="h-full flex-grow mt-6 text-center flex items-center justify-center border border-dotted">
              {selectedFileUrls && selectedFileUrls.length > 0 ? (
                <div className="grid-cols-2 overflow-x-clip max-h-[400px] overflow-y-scroll  w-[98%] mx-auto grid place-content-start  gap-2 ">
                  <label className="w-full hover:border-[#295639] border-2  flex-grow py-4 text-sm flex-col cursor-pointer flex gap-2 border-dotted items-center h-full justify-center">
                    <input
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      id="file-input"
                      type="file"
                    />
                    <p className="max-w-xs mb-4">Add More:</p>
                    <UploadIcon />
                  </label>
                  {selectedFileUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <button
                        onClick={() => deleteFile(url)}
                        className="absolute hover:scale-125 transition-transform w-5 h-5 flex items-center justify-center duration-150 -right-1 -top-1 bg-white rounded-full p-1"
                      >
                        <Cross1Icon stroke="#000" fill="#fff" />
                      </button>
                      <img
                        src={url}
                        className="aspect-square w-full h-full object-cover  border shadow-md"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <label className="w-full rounded-lg text-sm flex-col cursor-pointer flex-grow h-full flex gap-2 border-dotted items-center  justify-center">
                  <input
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    id="file-input"
                    type="file"
                  />
                  <p className="max-w-xs mb-4 text-sm font-medium">
                    Upload the image(s) you want to display on the homepage
                    here:
                  </p>
                  <UploadIcon />
                </label>
              )}
            </div>
            <DialogFooter>
              <button
                disabled={selectedFiles && selectedFiles.length === 0}
                onClick={() => uploadFilesToServer()}
                className="w-full border cursor-pointer flex gap-2 text-md font-bold items-center justify-center h-[40px]"
              >
                {uploadLoading
                  ? `Uploading ${noOfPhotosUploaded} / ${selectedFileUrls?.length} ...`
                  : "Upload"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
