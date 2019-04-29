---
id: Registry
title: Registry
---

<div class="contract-doc"><div class="contract"><h2 class="contract-header"><span class="contract-kind">contract</span> Registry</h2><p class="base-contracts"><span>is</span> <a href="Registry_Owned.html">Owned</a><span>, </span><a href="interfaces_IMetadataRegistry.html">IMetadataRegistry</a><span>, </span><a href="interfaces_IOwnerRegistry.html">IOwnerRegistry</a><span>, </span><a href="interfaces_IReverseRegistry.html">IReverseRegistry</a></p><p class="description">Stores human-readable keys associated with addresses, like DNS information (see https://wiki.parity.io/Parity-name-registry.html). Needed primarily to store the address of the `TxPermission` contract (see https://wiki.parity.io/Permissioning.html#transaction-type for details).</p><div class="source">Source: <a href="https://github.com/poanetwork/posdao-contracts/blob/v0.1.0/contracts/Registry.sol" target="_blank">contracts/Registry.sol</a></div></div><div class="index"><h2>Index</h2><ul><li><a href="Registry.html#Drained">Drained</a></li><li><a href="Registry.html#FeeChanged">FeeChanged</a></li><li><a href="Registry.html#ReverseProposed">ReverseProposed</a></li><li><a href="Registry.html#canReverse">canReverse</a></li><li><a href="Registry.html#confirmReverse">confirmReverse</a></li><li><a href="Registry.html#confirmReverseAs">confirmReverseAs</a></li><li><a href="Registry.html#drain">drain</a></li><li><a href="Registry.html#drop">drop</a></li><li><a href="Registry.html#">fallback</a></li><li><a href="Registry.html#getAddress">getAddress</a></li><li><a href="Registry.html#getData">getData</a></li><li><a href="Registry.html#getOwner">getOwner</a></li><li><a href="Registry.html#getReverse">getReverse</a></li><li><a href="Registry.html#getUint">getUint</a></li><li><a href="Registry.html#hasReverse">hasReverse</a></li><li><a href="Registry.html#onlyOwnerOf">onlyOwnerOf</a></li><li><a href="Registry.html#proposeReverse">proposeReverse</a></li><li><a href="Registry.html#removeReverse">removeReverse</a></li><li><a href="Registry.html#reserve">reserve</a></li><li><a href="Registry.html#reserved">reserved</a></li><li><a href="Registry.html#reverse">reverse</a></li><li><a href="Registry.html#setAddress">setAddress</a></li><li><a href="Registry.html#setData">setData</a></li><li><a href="Registry.html#setFee">setFee</a></li><li><a href="Registry.html#setUint">setUint</a></li><li><a href="Registry.html#transfer">transfer</a></li><li><a href="Registry.html#whenEntry">whenEntry</a></li><li><a href="Registry.html#whenEntryRaw">whenEntryRaw</a></li><li><a href="Registry.html#whenFeePaid">whenFeePaid</a></li><li><a href="Registry.html#whenProposed">whenProposed</a></li><li><a href="Registry.html#whenUnreserved">whenUnreserved</a></li></ul></div><div class="reference"><h2>Reference</h2><div class="events"><h3>Events</h3><ul><li><div class="item event"><span id="Drained" class="anchor-marker"></span><h4 class="name">Drained</h4><div class="body"><code class="signature">event <strong>Drained</strong><span>(uint amount) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>amount</code> - uint</div></dd></dl></div></div></li><li><div class="item event"><span id="FeeChanged" class="anchor-marker"></span><h4 class="name">FeeChanged</h4><div class="body"><code class="signature">event <strong>FeeChanged</strong><span>(uint amount) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>amount</code> - uint</div></dd></dl></div></div></li><li><div class="item event"><span id="ReverseProposed" class="anchor-marker"></span><h4 class="name">ReverseProposed</h4><div class="body"><code class="signature">event <strong>ReverseProposed</strong><span>(string name, address reverse) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>name</code> - string</div><div><code>reverse</code> - address</div></dd></dl></div></div></li></ul></div><div class="modifiers"><h3>Modifiers</h3><ul><li><div class="item modifier"><span id="onlyOwnerOf" class="anchor-marker"></span><h4 class="name">onlyOwnerOf</h4><div class="body"><code class="signature">modifier <strong>onlyOwnerOf</strong><span>(bytes32 _name) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd></dl></div></div></li><li><div class="item modifier"><span id="whenEntry" class="anchor-marker"></span><h4 class="name">whenEntry</h4><div class="body"><code class="signature">modifier <strong>whenEntry</strong><span>(string _name) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - string</div></dd></dl></div></div></li><li><div class="item modifier"><span id="whenEntryRaw" class="anchor-marker"></span><h4 class="name">whenEntryRaw</h4><div class="body"><code class="signature">modifier <strong>whenEntryRaw</strong><span>(bytes32 _name) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd></dl></div></div></li><li><div class="item modifier"><span id="whenFeePaid" class="anchor-marker"></span><h4 class="name">whenFeePaid</h4><div class="body"><code class="signature">modifier <strong>whenFeePaid</strong><span>() </span></code><hr/></div></div></li><li><div class="item modifier"><span id="whenProposed" class="anchor-marker"></span><h4 class="name">whenProposed</h4><div class="body"><code class="signature">modifier <strong>whenProposed</strong><span>(string _name) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - string</div></dd></dl></div></div></li><li><div class="item modifier"><span id="whenUnreserved" class="anchor-marker"></span><h4 class="name">whenUnreserved</h4><div class="body"><code class="signature">modifier <strong>whenUnreserved</strong><span>(bytes32 _name) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd></dl></div></div></li></ul></div><div class="functions"><h3>Functions</h3><ul><li><div class="item function"><span id="canReverse" class="anchor-marker"></span><h4 class="name">canReverse</h4><div class="body"><code class="signature">function <strong>canReverse</strong><span>(address _data) </span><span>external </span><span>view </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_data</code> - address</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="confirmReverse" class="anchor-marker"></span><h4 class="name">confirmReverse</h4><div class="body"><code class="signature">function <strong>confirmReverse</strong><span>(string _name) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntry">whenEntry </a><a href="Registry.html#whenProposed">whenProposed </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - string</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="confirmReverseAs" class="anchor-marker"></span><h4 class="name">confirmReverseAs</h4><div class="body"><code class="signature">function <strong>confirmReverseAs</strong><span>(string _name, address _who) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntry">whenEntry </a><a href="Registry_Owned.html#onlyOwner">onlyOwner </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - string</div><div><code>_who</code> - address</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="drain" class="anchor-marker"></span><h4 class="name">drain</h4><div class="body"><code class="signature">function <strong>drain</strong><span>() </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry_Owned.html#onlyOwner">onlyOwner </a></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="drop" class="anchor-marker"></span><h4 class="name">drop</h4><div class="body"><code class="signature">function <strong>drop</strong><span>(bytes32 _name) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a><a href="Registry.html#onlyOwnerOf">onlyOwnerOf </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="fallback" class="anchor-marker"></span><h4 class="name">fallback</h4><div class="body"><code class="signature">function <strong></strong><span>(address _certifierContract, address _owner) </span><span>public </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_certifierContract</code> - address</div><div><code>_owner</code> - address</div></dd></dl></div></div></li><li><div class="item function"><span id="getAddress" class="anchor-marker"></span><h4 class="name">getAddress</h4><div class="body"><code class="signature">function <strong>getAddress</strong><span>(bytes32 _name, string _key) </span><span>external </span><span>view </span><span>returns  (address) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_key</code> - string</div></dd><dt><span class="label-return">Returns:</span></dt><dd>address</dd></dl></div></div></li><li><div class="item function"><span id="getData" class="anchor-marker"></span><h4 class="name">getData</h4><div class="body"><code class="signature">function <strong>getData</strong><span>(bytes32 _name, string _key) </span><span>external </span><span>view </span><span>returns  (bytes32) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_key</code> - string</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bytes32</dd></dl></div></div></li><li><div class="item function"><span id="getOwner" class="anchor-marker"></span><h4 class="name">getOwner</h4><div class="body"><code class="signature">function <strong>getOwner</strong><span>(bytes32 _name) </span><span>external </span><span>view </span><span>returns  (address) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>address</dd></dl></div></div></li><li><div class="item function"><span id="getReverse" class="anchor-marker"></span><h4 class="name">getReverse</h4><div class="body"><code class="signature">function <strong>getReverse</strong><span>(bytes32 _name) </span><span>external </span><span>view </span><span>returns  (address) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>address</dd></dl></div></div></li><li><div class="item function"><span id="getUint" class="anchor-marker"></span><h4 class="name">getUint</h4><div class="body"><code class="signature">function <strong>getUint</strong><span>(bytes32 _name, string _key) </span><span>external </span><span>view </span><span>returns  (uint) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_key</code> - string</div></dd><dt><span class="label-return">Returns:</span></dt><dd>uint</dd></dl></div></div></li><li><div class="item function"><span id="hasReverse" class="anchor-marker"></span><h4 class="name">hasReverse</h4><div class="body"><code class="signature">function <strong>hasReverse</strong><span>(bytes32 _name) </span><span>external </span><span>view </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="proposeReverse" class="anchor-marker"></span><h4 class="name">proposeReverse</h4><div class="body"><code class="signature">function <strong>proposeReverse</strong><span>(string _name, address _who) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntry">whenEntry </a><a href="Registry.html#onlyOwnerOf">onlyOwnerOf </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - string</div><div><code>_who</code> - address</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="removeReverse" class="anchor-marker"></span><h4 class="name">removeReverse</h4><div class="body"><code class="signature">function <strong>removeReverse</strong><span>() </span><span>external </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntry">whenEntry </a></dd></dl></div></div></li><li><div class="item function"><span id="reserve" class="anchor-marker"></span><h4 class="name">reserve</h4><div class="body"><code class="signature">function <strong>reserve</strong><span>(bytes32 _name) </span><span>external </span><span>payable </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a><a href="Registry.html#whenUnreserved">whenUnreserved </a><a href="Registry.html#whenFeePaid">whenFeePaid </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="reserved" class="anchor-marker"></span><h4 class="name">reserved</h4><div class="body"><code class="signature">function <strong>reserved</strong><span>(bytes32 _name) </span><span>external </span><span>view </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="reverse" class="anchor-marker"></span><h4 class="name">reverse</h4><div class="body"><code class="signature">function <strong>reverse</strong><span>(address _data) </span><span>external </span><span>view </span><span>returns  (string) </span></code><hr/><dl><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_data</code> - address</div></dd><dt><span class="label-return">Returns:</span></dt><dd>string</dd></dl></div></div></li><li><div class="item function"><span id="setAddress" class="anchor-marker"></span><h4 class="name">setAddress</h4><div class="body"><code class="signature">function <strong>setAddress</strong><span>(bytes32 _name, string _key, address _value) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a><a href="Registry.html#onlyOwnerOf">onlyOwnerOf </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_key</code> - string</div><div><code>_value</code> - address</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="setData" class="anchor-marker"></span><h4 class="name">setData</h4><div class="body"><code class="signature">function <strong>setData</strong><span>(bytes32 _name, string _key, bytes32 _value) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a><a href="Registry.html#onlyOwnerOf">onlyOwnerOf </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_key</code> - string</div><div><code>_value</code> - bytes32</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="setFee" class="anchor-marker"></span><h4 class="name">setFee</h4><div class="body"><code class="signature">function <strong>setFee</strong><span>(uint _amount) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry_Owned.html#onlyOwner">onlyOwner </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_amount</code> - uint</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="setUint" class="anchor-marker"></span><h4 class="name">setUint</h4><div class="body"><code class="signature">function <strong>setUint</strong><span>(bytes32 _name, string _key, uint _value) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a><a href="Registry.html#onlyOwnerOf">onlyOwnerOf </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_key</code> - string</div><div><code>_value</code> - uint</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li><li><div class="item function"><span id="transfer" class="anchor-marker"></span><h4 class="name">transfer</h4><div class="body"><code class="signature">function <strong>transfer</strong><span>(bytes32 _name, address _to) </span><span>external </span><span>returns  (bool) </span></code><hr/><dl><dt><span class="label-modifiers">Modifiers:</span></dt><dd><a href="Registry.html#whenEntryRaw">whenEntryRaw </a><a href="Registry.html#onlyOwnerOf">onlyOwnerOf </a></dd><dt><span class="label-parameters">Parameters:</span></dt><dd><div><code>_name</code> - bytes32</div><div><code>_to</code> - address</div></dd><dt><span class="label-return">Returns:</span></dt><dd>bool</dd></dl></div></div></li></ul></div></div></div>