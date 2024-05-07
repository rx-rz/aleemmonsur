import {
  CaretLeftIcon,
  CaretRightIcon,
  Cross1Icon,
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
import { getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { addDoc, collection, getDocs } from "firebase/firestore";
import imageCompression from "browser-image-compression";

export default function App() {
  const [pics, setPics] = useState<
    { url: string; is_approved: boolean; date_added: number }[] | []
  >();
  const [selectedFiles, setSelectedFiles] = useState<File[] | []>();
  const [selectedFileUrls, setSelectedFileUrls] = useState<string[] | []>();
  const [displayedImages, setDisplayedImages] = useState<
    { url: string; is_approved: boolean; date_added: number }[] | []
  >();
  // const [picsLoading, setPicsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  // const [totalPercentage, setTotalPercentage] = useState(0);
  const [uploadLoading, setUploadLoading] = useState(false);
  const totalPages = Math.ceil((selectedFileUrls?.length || 0) / 4);
  const [currentUrl, setCurrentUrl] = useState((pics && pics[0].url) || "");
  const paginateImages = (startIndex = 0) => {
    const selected = pics?.slice(startIndex, startIndex + 4);
    setDisplayedImages(selected);
  };

  useEffect(() => {
    async function getAllPics() {
      // setPicsLoading(true);
      const picsRef = collection(database, "images");
      const querySnapshot = await getDocs(picsRef);
      let pics: { url: string; is_approved: boolean; date_added: number }[] =
        [];
      if (querySnapshot.docs.length > 0) {
        querySnapshot.forEach((doc) => {
          pics.push({
            url: doc.data().url,
            is_approved: doc.data().is_approved,
            date_added: doc.data().date_added,
          });
        });
        pics.sort((a, b) => b.date_added - a.date_added);
        setPics(pics);
        setDisplayedImages(pics.slice(0, 4));
      }
    }
    getAllPics();
    // setPicsLoading(false);
  }, []);
  useEffect(() => {
    console.log(pics);
  }, [pics]);

  useEffect(() => {
    paginateImages(currentPage * 4);
  }, [currentPage, selectedFileUrls]);

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
          await uploadImageAsPromise(compressedImage);
          console.log({ compressedImage });
        }
      }
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
          });
          resolve();
        }
      );
    });
  }
  function activateCarouselByImageUrl(action: "back" | "forward") {
    if (pics) {
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

  const deleteFile = (url: string) => {
    const newFiles = selectedFileUrls?.filter((fileUrl) => fileUrl !== url);
    setSelectedFileUrls(newFiles);
  };

  return (
    <main className="h-screen overflow-y-scroll">
      <nav className="absolute top-4 left-2 right-2 z-10">
        <img src="/logo.png" className="w-[40px] h-[40px]" alt="" />
      </nav>
      <div className="flex items-center mb-4 gap-3 absolute right-2 top-6 z-10">
        <button
          className="w-[20px] h-[20px] disabled:opacity-25 flex items-center justify-center rounded-full  bg-[#295639] "
          onClick={() => {
            // location.reload();
            setCurrentPage(currentPage - 1);
          }}
          disabled={currentPage === 0}
        >
          <CaretLeftIcon stroke="#fff" />
        </button>
        <button
          className="w-[20px] h-[20px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
          onClick={() => {
            // location.reload();
            setCurrentPage(currentPage + 1);
          }}
          disabled={currentPage === totalPages - 1}
        >
          <CaretRightIcon stroke="#fff" />
        </button>
      </div>
      <div className="absolute z-10  bottom-4 left-1/2 -translate-x-1/2 peer-focus-within:scale-125 backdrop-blur-md">
        <Dialog>
          <DialogTrigger className="flex items-center gap-3 bottom-4  transition-transform duration-150  px-2 bg-white rounded-md bg-clip-padding py-2 backdrop-filter backdrop-blur-xl bg-opacity-90 border border-gray-100">
            <UploadIcon />{" "}
            <p className="font-satoshi text-sm font-medium">Upload Images</p>
          </DialogTrigger>
          <DialogContent className="min-h-[500px] flex flex-col max-w-[400px] w-[95%] rounded-md">
            <div className="h-full flex-grow mt-6 rounded-lg text-center flex items-center justify-center border border-dotted">
              {selectedFileUrls && selectedFileUrls.length > 0 ? (
                <div className="grid-cols-2 overflow-x-clip max-h-[400px] overflow-y-scroll  w-[98%] mx-auto grid place-content-start  gap-2 ">
                  <label className="w-full hover:border-[#295639] border-2 rounded-lg flex-grow py-4 text-sm flex-col cursor-pointer flex gap-2 border-dotted items-center h-full justify-center">
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
                        className="absolute hover:scale-125 transition-transform duration-150 -right-1 -top-1 bg-white rounded-full p-1"
                      >
                        <Cross1Icon stroke="#000" fill="#fff" />
                      </button>
                      <img
                        src={url}
                        className="aspect-square w-full h-full object-cover rounded-md border shadow-md"
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
                  <p className="max-w-xs mb-4">
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
                  ? "Submitting..."
                  : // `${Math.round(
                    //     (totalPercentage / (selectedFiles!.length * 100)) * 100
                    //   )}% uploaded...`
                    "Submit"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid  w-[90%] mt-20 mx-auto lg:grid-cols-2 grid-cols-1 xl:grid-cols-4 grid-flow-row gap-3">
        {pics &&
          displayedImages &&
          displayedImages.map((pic, index) => (
            <Dialog key={index}>
              <div className="relative">
                <DialogTrigger onClick={() => setCurrentUrl(pic.url)}>
                  <img
                    src={pic.url}
                    className=" w-full aspect-square h-full object-cover rounded-md border shadow-md"
                  />
                </DialogTrigger>
                <DialogContent className="bg-transparent border-none flex items-center">
                  <button
                    className="w-[20px] h-[20px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
                    onClick={() => activateCarouselByImageUrl("back")}
                    disabled={
                      pics?.findIndex((pic) => currentUrl === pic.url) === 0
                    }
                  >
                    <CaretLeftIcon stroke="#fff" />
                  </button>
                  <img
                    src={currentUrl}
                    className=" w-[80%] border-double  h-full object-cover   shadow-lg"
                  />
                  <button
                    className="w-[20px] h-[20px] rounded-full disabled:opacity-25 flex items-center justify-center bg-[#295639] "
                    onClick={() => activateCarouselByImageUrl("forward")}
                    disabled={
                      pics
                        ? pics?.findIndex((pic) => currentUrl === pic.url) ===
                          pics?.length - 1
                        : true
                    }
                  >
                    <CaretRightIcon stroke="#fff" />
                  </button>
                </DialogContent>
              </div>
            </Dialog>
          ))}
      </div>
    </main>
  );
}
