import { ChangeEvent, useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./components/ui/drawer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./components/ui/carousel";

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>();
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  // JSON.parse(localStorage.getItem("images")!) || null
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files: File[] = [];
    const fileUrls: string[] = [];
    if (event.target.files) {
      for (let i = 0; i < event.target.files?.length; i++) {
        const fileItem = event.target.files.item(i);
        console.log(fileItem);
        files.push(fileItem!);
        fileUrls.push(URL.createObjectURL(fileItem!));
      }
    }
    setSelectedFiles(files);
    setFileUrls(fileUrls);
  };

  console.log({ selectedFiles, fileUrls });
  return (
    <main className="h-screen bg-[#1a4a2b] overflow-y-scroll">
      <div className="m-2 h-[95%] p-5 bg-white  rounded-lg relative flex flex-col">
        <div className="flex justify-between flex-wrap">
          <img src="/logo.png" alt="" className="w-[50px] h-[50px]" />
          <p className="max-w-xl text-justify">
            Talking about his record-extending 14th French Open title,
            36-year-old Rafael Nadal said it's "amazing" and means everything.
            "Much more probably emotional than the first time because [it's]
            completely unexpected to be where I am at this age, at this stage of
            my career." It's Nadal's 22nd Grand Slam title. At 19, he won the
            2005 French Open on his debut.
          </p>
        </div>
        <Drawer>
          <div className="mt-auto w-fit mx-auto ">
            <DrawerTrigger className="p-2  rounded-xl border">
              UPLOAD IMAGES
            </DrawerTrigger>
          </div>
          <DrawerContent className="min-h-[50vh] ">
            <DrawerHeader className="text-center">
              <DrawerTitle>Upload an image</DrawerTitle>
              <DrawerDescription className="flex flex-col h-full mt-2">
                {fileUrls.length === 0 ? (
                  <label className="min-h-[300px] text-center cursor-pointer flex items-center justify-center border border-dotted">
                    <span>Upload Image</span>
                    <input
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                      id="file-input"
                      type="file"
                    />
                  </label>
                ) : (
                  <div className="flex gap-2 mx-auto w-fit">
                    <Carousel className="w-fit mx-auto max-w-[70%]">
                      <CarouselContent className="basis-1">
                        {fileUrls.map((url, index) => (
                          <CarouselItem
                            key={index}
                            className="max-w-[300px] max-h-[300px]"
                          >
                            <img
                              src={url}
                              alt={index.toString()}
                              className="w-full object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                )}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Upload</Button>
              <DrawerClose>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </main>
  );
}

export default App;
