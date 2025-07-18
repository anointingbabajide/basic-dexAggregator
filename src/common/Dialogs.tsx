import * as React from "react";
import { Dialog } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";
import Image from "next/image";
import { IModalRoot, TokenInfo } from "@/interface/tokenInfo";

const ModalContent = (tokenInfo: TokenInfo, status: IModalRoot) => {
  return (
    <Dialog.Root open={status.open} onOpenChange={status.onOpenChange}>
      <Dialog.Trigger asChild>
        <button>Select Token</button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-blackA6 data-[state=open]:animate-overlayShow" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray1 p-[25px] shadow-[var(--shadow-6)] focus:outline-none data-[state=open]:animate-contentShow">
          <Dialog.Title className="m-0 text-[17px] font-medium text-mauve12">
            <input
              // value={filter}
              // onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Search by name, symbol or address"
              className="w-full p-2 rounded"
              autoFocus
            />
          </Dialog.Title>
          <Dialog.Description className="mb-5 mt-2.5 text-[15px] leading-normal text-mauve11">
            Search for a token to swap, or enter the address of the token you
            want to add.
          </Dialog.Description>
          <React.Fragment>
            <div className="bg-black border border-gray-400">
              <div className="flex items-center justify-between flex-row">
                {/* <Image src */}
                <div className="flex flex-col space-y-6">
                  <Image
                    src={tokenInfo.image}
                    alt={tokenInfo.name}
                    width={25}
                    height={25}
                  />
                  <h2 className="text-lg font-bold text-gray-100">
                    {tokenInfo.symbol}
                  </h2>
                  <p className="text-sm font-medium text-gray-100">
                    {tokenInfo.name}
                  </p>
                  <p className="text-sm font-medium text-gray-100">
                    {tokenInfo.address}
                  </p>
                </div>
              </div>
            </div>
          </React.Fragment>
          {/* <div className="mt-[25px] flex justify-end">
            <Dialog.Close asChild>
              <button className="inline-flex h-[35px] items-center justify-center rounded bg-green4 px-[15px] font-medium leading-none text-green11 outline-none outline-offset-1 hover:bg-green5 focus-visible:outline-2 focus-visible:outline-green6 select-none">
                Save changes
              </button>
            </Dialog.Close>
          </div> */}
          <Dialog.Close asChild>
            <button
              className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full text-violet11 bg-gray3 hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7 focus:outline-none"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ModalContent;
