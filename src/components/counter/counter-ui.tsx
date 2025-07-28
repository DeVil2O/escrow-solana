import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useCounterProgram, useCounterProgramAccount } from './counter-data-access'

export function CounterCreate() {
  const { initialize } = useCounterProgram()

  return (
    <Button onClick={() => initialize.mutateAsync(1000)} disabled={initialize.isPending}>
      Create {initialize.isPending && '...'}
    </Button>
  )
}

export function CounterList() {
  const { accounts, getProgramAccount } = useCounterProgram()

  console.log({ accounts })

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4">
      {/* <CounterCreate /> */}
      <div className="grid md:grid-cols-2 gap-4">
        {accounts.data?.map((account) => (
          <CounterCard key={account.publicKey.toString()} account={account.publicKey} />
        ))}
      </div>
    </div>
  )
}

function CounterCard({ account }: { account: PublicKey }) {
  const { accountQuery, release } = useCounterProgramAccount({
    account,
  })

  const amount = useMemo(() => accountQuery.data?.amount.toNumber() ?? 0, [accountQuery.data?.amount])

  const isReleased = useMemo(() => accountQuery.data?.isReleased ?? false, [accountQuery.data?.isReleased])

  console.log({ isReleased }, accountQuery.data)

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="flex flex-col gap-4">
      <p>Amount: {amount}</p>
      <Button onClick={() => release.mutateAsync()} disabled={release.isPending}>
        Release
      </Button>
    </div>
  )
}
